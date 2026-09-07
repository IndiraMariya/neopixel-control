// XIAO ESP32C6 - BLE color + brightness control for 6 NeoPixel strips (D0-D5)
//
// Structure intentionally mirrors the working BLE server example from:
// https://wiki.seeedstudio.com/xiao_esp32c6_bluetooth/
//
// Write "R,G,B,BRIGHTNESS" (e.g. 255,94,0,200) to a strip's characteristic
// to set its color and brightness. Write a scheme name (sunset/ocean/forest/off)
// to the scheme characteristic to apply a preset across all 6 strips.
//
// Each strip can have a DIFFERENT number of pixels - set them individually below.
//
// Every applied color+brightness is persisted to flash (NVS, via Preferences)
// and restored on boot, so the strips come back the way they were left after
// a power cut instead of resetting to off.

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Adafruit_NeoPixel.h>
#include <Preferences.h>

// ---- NeoPixel setup ---------------------------------------------------
#define PIN_STRIP_0 D0
#define PIN_STRIP_1 D1
#define PIN_STRIP_2 D2
#define PIN_STRIP_3 D4
#define PIN_STRIP_4 D5
#define PIN_STRIP_5 D6

// Set each strip's pixel count individually here:
#define NUM_PIXELS_0 14
#define NUM_PIXELS_1 17
#define NUM_PIXELS_2 8
#define NUM_PIXELS_3 8
#define NUM_PIXELS_4 1
#define NUM_PIXELS_5 2

Adafruit_NeoPixel strip0(NUM_PIXELS_0, PIN_STRIP_0, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip1(NUM_PIXELS_1, PIN_STRIP_1, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip2(NUM_PIXELS_2, PIN_STRIP_2, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip3(NUM_PIXELS_3, PIN_STRIP_3, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip4(NUM_PIXELS_4, PIN_STRIP_4, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel strip5(NUM_PIXELS_5, PIN_STRIP_5, NEO_GRB + NEO_KHZ800);

// ---- BLE UUIDs ----------------------------------------------------------
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID_STRIP0 "beb5483e-36e1-4688-b7f5-ea07361b26a1"
#define CHAR_UUID_STRIP1 "beb5483e-36e1-4688-b7f5-ea07361b26a2"
#define CHAR_UUID_STRIP2 "beb5483e-36e1-4688-b7f5-ea07361b26a3"
#define CHAR_UUID_STRIP3 "beb5483e-36e1-4688-b7f5-ea07361b26a6"
#define CHAR_UUID_STRIP4 "beb5483e-36e1-4688-b7f5-ea07361b26a7"
#define CHAR_UUID_STRIP5 "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHAR_UUID_ALL "beb5483e-36e1-4688-b7f5-ea07361b26a4"
#define CHAR_UUID_SCHEME "beb5483e-36e1-4688-b7f5-ea07361b26a5"

BLECharacteristic *pCharStrip0;
BLECharacteristic *pCharStrip1;
BLECharacteristic *pCharStrip2;
BLECharacteristic *pCharStrip3;
BLECharacteristic *pCharStrip4;
BLECharacteristic *pCharStrip5;
BLECharacteristic *pCharAll;
BLECharacteristic *pCharScheme;

BLEServer *pServer;

// ---- Persisted state (survives power loss) -------------------------------
// Each strip's last-applied {r,g,b,brightness} is stored as a 4-byte blob
// under its own key ("s0".."s5") in the "neopixel" NVS namespace.
Preferences prefs;

void saveStripState(int idx, uint8_t r, uint8_t g, uint8_t b, uint8_t brightness) {
  uint8_t buf[4] = { r, g, b, brightness };
  char key[4];
  snprintf(key, sizeof(key), "s%d", idx);
  prefs.putBytes(key, buf, sizeof(buf));
}

bool loadStripState(int idx, uint8_t &r, uint8_t &g, uint8_t &b, uint8_t &brightness) {
  char key[4];
  snprintf(key, sizeof(key), "s%d", idx);
  uint8_t buf[4];
  if (prefs.getBytes(key, buf, sizeof(buf)) != sizeof(buf)) return false;
  r = buf[0];
  g = buf[1];
  b = buf[2];
  brightness = buf[3];
  return true;
}

// ---- Server-level callback: restart advertising after a disconnect -----
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    Serial.println("Client connected.");
  }

  void onDisconnect(BLEServer *pServer) {
    Serial.println("Client disconnected. Restarting advertising...");
    delay(500);
    pServer->startAdvertising();
  }
};

// ---- Helpers ------------------------------------------------------------
// Applies a color+brightness to a strip AND persists it as that strip's
// last-known state, so it can be restored after a power cycle. `idx` is the
// strip's index (0-5), used as its storage key.
void applyColorBrightness(Adafruit_NeoPixel &strip, int idx, uint8_t r, uint8_t g, uint8_t b, uint8_t brightness) {
  strip.setBrightness(brightness);
  uint32_t color = strip.Color(r, g, b);
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, color);
  }
  strip.show();
  saveStripState(idx, r, g, b, brightness);
}

// Applies a strip's saved state on boot, falling back to off if nothing was
// saved yet (e.g. the very first boot).
void restoreStrip(Adafruit_NeoPixel &strip, int idx) {
  uint8_t r, g, b, brightness;
  if (loadStripState(idx, r, g, b, brightness)) {
    applyColorBrightness(strip, idx, r, g, b, brightness);
    Serial.printf("Strip %d restored -> R:%d G:%d B:%d Brightness:%d\n", idx, r, g, b, brightness);
  } else {
    applyColorBrightness(strip, idx, 0, 0, 0, 0);
  }
}

bool parseColorCommand(const String &value, uint8_t &r, uint8_t &g, uint8_t &b, uint8_t &brightness) {
  int vals[4];
  int startIdx = 0;
  for (int i = 0; i < 4; i++) {
    int commaIdx = value.indexOf(',', startIdx);
    String part = (i < 3) ? value.substring(startIdx, commaIdx) : value.substring(startIdx);
    if (i < 3 && commaIdx == -1) return false;
    vals[i] = part.toInt();
    startIdx = commaIdx + 1;
  }
  r = constrain(vals[0], 0, 255);
  g = constrain(vals[1], 0, 255);
  b = constrain(vals[2], 0, 255);
  brightness = constrain(vals[3], 0, 255);
  return true;
}

// ---- Callback for a single strip's characteristic ----------------------
class StripCallback : public BLECharacteristicCallbacks {
public:
  StripCallback(Adafruit_NeoPixel &s, const char *label, int idx)
    : strip(s), label(label), index(idx) {}
  void onWrite(BLECharacteristic *pChar) {
    String value = pChar->getValue();
    if (value.length() == 0) return;
    uint8_t r, g, b, brightness;
    if (parseColorCommand(value, r, g, b, brightness)) {
      applyColorBrightness(strip, index, r, g, b, brightness);
      Serial.printf("%s -> R:%d G:%d B:%d Brightness:%d\n", label, r, g, b, brightness);
    }
  }
private:
  Adafruit_NeoPixel &strip;
  const char *label;
  int index;
};

// ---- Callback for the "all strips" characteristic ----------------------
class AllStripsCallback : public BLECharacteristicCallbacks {
public:
  void onWrite(BLECharacteristic *pChar) {
    String value = pChar->getValue();
    if (value.length() == 0) return;
    uint8_t r, g, b, brightness;
    if (parseColorCommand(value, r, g, b, brightness)) {
      applyColorBrightness(strip0, 0, r, g, b, brightness);
      applyColorBrightness(strip1, 1, r, g, b, brightness);
      applyColorBrightness(strip2, 2, r, g, b, brightness);
      applyColorBrightness(strip3, 3, r, g, b, brightness);
      applyColorBrightness(strip4, 4, r, g, b, brightness);
      applyColorBrightness(strip5, 5, r, g, b, brightness);
      Serial.printf("ALL -> R:%d G:%d B:%d Brightness:%d\n", r, g, b, brightness);
    }
  }
};

// ---- Callback for scheme presets ---------------------------------------
// Each strip gets its own tone within the scheme so all 6 look cohesive
// but distinct, rather than every strip matching exactly.
class SchemeCallback : public BLECharacteristicCallbacks {
public:
  void onWrite(BLECharacteristic *pChar) {
    String scheme = pChar->getValue();
    scheme.trim();
    scheme.toLowerCase();
    Serial.print("Scheme requested: ");
    Serial.println(scheme);

    if (scheme == "sunset") {
      applyColorBrightness(strip0, 0, 255, 94, 0, 200);    // deep orange
      applyColorBrightness(strip1, 1, 255, 130, 20, 200);  // orange-amber
      applyColorBrightness(strip2, 2, 255, 61, 70, 200);   // rose/coral
      applyColorBrightness(strip3, 3, 214, 30, 70, 200);   // rose red
      applyColorBrightness(strip4, 4, 150, 20, 100, 200);  // magenta-purple
      applyColorBrightness(strip5, 5, 70, 20, 120, 200);   // dusk purple
    } else if (scheme == "ocean") {
      applyColorBrightness(strip0, 0, 0, 150, 255, 200);  // sky blue
      applyColorBrightness(strip1, 1, 0, 180, 230, 200);  // light blue
      applyColorBrightness(strip2, 2, 0, 200, 200, 200);  // teal
      applyColorBrightness(strip3, 3, 0, 150, 160, 200);  // deep teal
      applyColorBrightness(strip4, 4, 0, 100, 190, 200);  // ocean blue
      applyColorBrightness(strip5, 5, 0, 80, 180, 200);   // deep blue
    } else if (scheme == "forest") {
      applyColorBrightness(strip0, 0, 30, 150, 40, 200);   // green
      applyColorBrightness(strip1, 1, 70, 160, 20, 200);   // leaf green
      applyColorBrightness(strip2, 2, 120, 160, 20, 200);  // yellow-green
      applyColorBrightness(strip3, 3, 20, 120, 60, 200);   // pine green
      applyColorBrightness(strip4, 4, 10, 90, 50, 200);    // deep green
      applyColorBrightness(strip5, 5, 40, 70, 20, 200);    // moss
    } else if (scheme == "off") {
      applyColorBrightness(strip0, 0, 0, 0, 0, 0);
      applyColorBrightness(strip1, 1, 0, 0, 0, 0);
      applyColorBrightness(strip2, 2, 0, 0, 0, 0);
      applyColorBrightness(strip3, 3, 0, 0, 0, 0);
      applyColorBrightness(strip4, 4, 0, 0, 0, 0);
      applyColorBrightness(strip5, 5, 0, 0, 0, 0);
    } else {
      Serial.println("Unknown scheme name.");
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE work!");

  strip0.begin();
  strip1.begin();
  strip2.begin();
  strip3.begin();
  strip4.begin();
  strip5.begin();

  prefs.begin("neopixel", false);  // false = read/write mode

  // Restore each strip to whatever it was last set to before power was
  // lost (or off, on the very first boot when nothing's saved yet).
  restoreStrip(strip0, 0);
  restoreStrip(strip1, 1);
  restoreStrip(strip2, 2);
  restoreStrip(strip3, 3);
  restoreStrip(strip4, 4);
  restoreStrip(strip5, 5);

  BLEDevice::init("XIAO_ESP32C6");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharStrip0 = pService->createCharacteristic(
    CHAR_UUID_STRIP0, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharStrip1 = pService->createCharacteristic(
    CHAR_UUID_STRIP1, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharStrip2 = pService->createCharacteristic(
    CHAR_UUID_STRIP2, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharStrip3 = pService->createCharacteristic(
    CHAR_UUID_STRIP3, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharStrip4 = pService->createCharacteristic(
    CHAR_UUID_STRIP4, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharStrip5 = pService->createCharacteristic(
    CHAR_UUID_STRIP5, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharAll = pService->createCharacteristic(
    CHAR_UUID_ALL, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharScheme = pService->createCharacteristic(
    CHAR_UUID_SCHEME, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);

  pCharStrip0->setCallbacks(new StripCallback(strip0, "Strip 0 (D0)", 0));
  pCharStrip1->setCallbacks(new StripCallback(strip1, "Strip 1 (D1)", 1));
  pCharStrip2->setCallbacks(new StripCallback(strip2, "Strip 2 (D2)", 2));
  pCharStrip3->setCallbacks(new StripCallback(strip3, "Strip 3 (D3)", 3));
  pCharStrip4->setCallbacks(new StripCallback(strip4, "Strip 4 (D4)", 4));
  pCharStrip5->setCallbacks(new StripCallback(strip5, "Strip 5 (D5)", 5));
  pCharAll->setCallbacks(new AllStripsCallback());
  pCharScheme->setCallbacks(new SchemeCallback());

  pCharStrip0->setValue("0,0,0,0");
  pCharStrip1->setValue("0,0,0,0");
  pCharStrip2->setValue("0,0,0,0");
  pCharStrip3->setValue("0,0,0,0");
  pCharStrip4->setValue("0,0,0,0");
  pCharStrip5->setValue("0,0,0,0");
  pCharAll->setValue("0,0,0,0");
  pCharScheme->setValue("off");

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("Characteristics defined! Now you can read/write them from nRF Connect or Bluefy.");
}

void loop() {
  delay(2000);
}
