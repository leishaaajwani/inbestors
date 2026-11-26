// InBestor console for Arduino 101
// Sends what the players do to the website over USB, and lights the RGB LED when the website asks.
//
// Messages sent to the website (one per line):
//   L, R, U, D   joystick pushed left, right, up, down
//   CLICK        joystick pressed down
//   OK           yellow Confirm button
//   EVENT        small black Event button
//   TAG:XXXXXXXX an RFID tag was tapped (its ID in hex)
// Messages the website sends back:
//   LED:G  LED:R  LED:B  LED:Y  LED:OFF
//
// Needs the "MFRC522" library (Sketch > Include Library > Manage Libraries, search MFRC522).
// The sketch still works if the RFID reader is not connected yet.

#include <SPI.h>
#include <MFRC522.h>

// ----- pins (same as the wiring guide) -----
const int PIN_JOY_X   = A1;
const int PIN_JOY_Y   = A2;
const int PIN_JOY_SW  = A3;
const int PIN_EVENT   = A0;
const int PIN_CONFIRM = 8;
const int PIN_LED_R   = 3;
const int PIN_LED_G   = 5;
const int PIN_LED_B   = 6;
const int PIN_RFID_SS = 10;
const int PIN_RFID_RST = 9;

// ----- settings you might need to flip -----
const int  CONFIRM_PRESSED = HIGH;   // if Confirm fires all the time or never, change to LOW
const bool LED_COMMON_ANODE = true;  // the RGB module has a V pin, so LOW means on
const bool FLIP_X = false;           // set true if left and right come out backwards
const bool FLIP_Y = false;           // set true if up and down come out backwards

const int JOY_LOW = 250;             // below this counts as a push
const int JOY_HIGH = 770;            // above this counts as a push
const unsigned long DEBOUNCE_MS = 40;

MFRC522 rfid(PIN_RFID_SS, PIN_RFID_RST);

struct Button {
  int pin;
  int pressedLevel;
  const char *message;
  bool down;
  unsigned long lastChange;
};

Button buttons[] = {
  { PIN_CONFIRM, CONFIRM_PRESSED, "OK",    false, 0 },
  { PIN_EVENT,   LOW,             "EVENT", false, 0 },
  { PIN_JOY_SW,  LOW,             "CLICK", false, 0 }
};
const int BUTTON_COUNT = sizeof(buttons) / sizeof(buttons[0]);

char joyState = 0;                   // which way the joystick is held right now (0 = middle)
String inbox = "";
String lastTag = "";
unsigned long lastTagTime = 0;

void setColor(int r, int g, int b) {
  if (LED_COMMON_ANODE) { r = 255 - r; g = 255 - g; b = 255 - b; }
  analogWrite(PIN_LED_R, r);
  analogWrite(PIN_LED_G, g);
  analogWrite(PIN_LED_B, b);
}

void setup() {
  pinMode(PIN_CONFIRM, INPUT);
  pinMode(PIN_EVENT, INPUT_PULLUP);
  pinMode(PIN_JOY_SW, INPUT_PULLUP);
  pinMode(PIN_LED_R, OUTPUT);
  pinMode(PIN_LED_G, OUTPUT);
  pinMode(PIN_LED_B, OUTPUT);

  Serial.begin(115200);
  unsigned long start = millis();
  while (!Serial && millis() - start < 3000) { }   // wait up to 3 s for USB

  SPI.begin();
  rfid.PCD_Init();

  // quick hello: red, green, blue, off
  setColor(255, 0, 0); delay(200);
  setColor(0, 255, 0); delay(200);
  setColor(0, 0, 255); delay(200);
  setColor(0, 0, 0);
  Serial.println("HELLO");
}

void readButtons() {
  unsigned long now = millis();
  for (int i = 0; i < BUTTON_COUNT; i++) {
    bool pressed = digitalRead(buttons[i].pin) == buttons[i].pressedLevel;
    if (pressed != buttons[i].down && now - buttons[i].lastChange > DEBOUNCE_MS) {
      buttons[i].down = pressed;
      buttons[i].lastChange = now;
      if (pressed) Serial.println(buttons[i].message);
    }
  }
}

void readJoystick() {
  int x = analogRead(PIN_JOY_X);
  int y = analogRead(PIN_JOY_Y);
  char dir = 0;
  if (x < JOY_LOW)       dir = FLIP_X ? 'R' : 'L';
  else if (x > JOY_HIGH) dir = FLIP_X ? 'L' : 'R';
  else if (y < JOY_LOW)  dir = FLIP_Y ? 'D' : 'U';
  else if (y > JOY_HIGH) dir = FLIP_Y ? 'U' : 'D';

  // send once per push; the stick has to come back to the middle before the next one
  if (dir != joyState) {
    joyState = dir;
    if (dir) Serial.println(dir);
  }
}

void readTag() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  String id = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) id += "0";
    id += String(rfid.uid.uidByte[i], HEX);
  }
  id.toUpperCase();
  // ignore the same tag resting on the reader
  if (id != lastTag || millis() - lastTagTime > 2000) {
    Serial.print("TAG:");
    Serial.println(id);
  }
  lastTag = id;
  lastTagTime = millis();
  rfid.PICC_HaltA();
}

void readWebsite() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      inbox.trim();
      if (inbox == "LED:G") setColor(0, 255, 0);
      else if (inbox == "LED:R") setColor(255, 0, 0);
      else if (inbox == "LED:B") setColor(0, 0, 255);
      else if (inbox == "LED:Y") setColor(255, 160, 0);
      else if (inbox == "LED:OFF") setColor(0, 0, 0);
      inbox = "";
    } else if (inbox.length() < 32) {
      inbox += c;
    }
  }
}

void loop() {
  readButtons();
  readJoystick();
  readTag();
  readWebsite();
  delay(5);
}
