// XIAO ESP32C6 - Single-strip diagnostic tester
//
// Tests ONE strip at a time over Serial so you can isolate wiring/pixel
// issues without BLE in the mix. No Bluetooth involved - just plug in,
// open Serial Monitor, and type commands.
//
// HOW TO USE:
// 1. Set NUM_PIXELS below to the pixel count of whichever strip you're
//    currently testing (change it and re-upload for each strip).
// 2. Wire ONLY the strip you're testing to TEST_PIN (see below) + VBUS + GND.
// 3. Open Serial Monitor at 115200 baud, line ending set to "Newline".
// 4. Type one of these commands and hit Enter:
//      r        -> solid red
//      g        -> solid green
//      b        -> solid blue
//      w        -> solid white
//      off      -> turn off
//      chase    -> single-pixel chase down the strip (great for spotting
//                  a dead pixel or a break in the data line)
//      count    -> prints how many pixels are configured
//
// If "chase" stops partway down the strip, that tells you exactly which
// pixel is bad (whatever number it stopped after).

#include <Adafruit_NeoPixel.h>

// ---- CHANGE THESE TWO FOR EACH STRIP YOU TEST ---------------------------
#define TEST_PIN     D0     // change to D0/D1/D2/D3/D4/D5 depending on strip
#define NUM_PIXELS   17      // change to match this strip's actual pixel count
// --------------------------------------------------------------------------

Adafruit_NeoPixel strip(NUM_PIXELS, TEST_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  Serial.begin(115200);
  delay(1000);

  strip.begin();
  strip.setBrightness(150);
  strip.show(); // all off initially

  Serial.println();
  Serial.println("=== NeoPixel single-strip tester ===");
  Serial.printf("Testing pin: %d | Pixel count: %d\n", TEST_PIN, NUM_PIXELS);
  Serial.println("Commands: r / g / b / w / off / chase / count");
  Serial.println("Type a command and press Enter.");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toLowerCase();

    if (cmd == "r") {
      fillSolid(strip.Color(255, 0, 0));
      Serial.println("-> Red");
    } else if (cmd == "g") {
      fillSolid(strip.Color(0, 255, 0));
      Serial.println("-> Green");
    } else if (cmd == "b") {
      fillSolid(strip.Color(0, 0, 255));
      Serial.println("-> Blue");
    } else if (cmd == "w") {
      fillSolid(strip.Color(255, 255, 255));
      Serial.println("-> White");
    } else if (cmd == "off") {
      fillSolid(strip.Color(0, 0, 0));
      Serial.println("-> Off");
    } else if (cmd == "chase") {
      Serial.println("-> Running chase test...");
      runChase();
      Serial.println("-> Chase complete. If it stopped early, note the last pixel number printed.");
    } else if (cmd == "count") {
      Serial.printf("-> Configured for %d pixels on pin %d\n", NUM_PIXELS, TEST_PIN);
    } else if (cmd.length() > 0) {
      Serial.println("-> Unknown command. Use: r / g / b / w / off / chase / count");
    }
  }
}

void fillSolid(uint32_t color) {
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, color);
  }
  strip.show();
}

void runChase() {
  fillSolid(strip.Color(0, 0, 0)); // clear first

  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(0, 255, 255)); // cyan dot
    strip.show();
    Serial.printf("   Pixel %d lit\n", i);
    delay(200);
    strip.setPixelColor(i, strip.Color(0, 0, 0)); // clear before next
  }
  strip.show();
}
