   #define SIM800L_IP5306_VERSION_20190610
// #define SIM800L_AXP192_VERSION_20200327
// #define SIM800C_AXP192_VERSION_20200609
// #define SIM800L_IP5306_VERSION_20200811

// Define the serial console for debug prints, if needed
#define DUMP_AT_COMMANDS
#define TINY_GSM_DEBUG          SerialMon

#include "utilities.h"

// Set serial for debug console (to the Serial Monitor, default speed 115200)
#define SerialMon Serial
// Set serial for AT commands (to the module)
#define SerialAT  Serial1

// Configure TinyGSM library
#define TINY_GSM_MODEM_SIM800          // Modem is SIM800
#define TINY_GSM_RX_BUFFER      1024   // Set RX buffer to 1Kb

#include <TinyGsmClient.h>

#ifdef DUMP_AT_COMMANDS
#include <StreamDebugger.h>
StreamDebugger debugger(SerialAT, SerialMon);
TinyGsm modem(debugger);
#else
TinyGsm modem(SerialAT);
#endif

#define CALL_TARGET "+48609558809"

void setup()
{
    pinMode(LED_GPIO, OUTPUT);
    SerialMon.begin(115200); delay(10);
    setupModem();
    digitalWrite(LED_GPIO, HIGH);
    SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX); delay(6000);
    SerialMon.println("Initializing modem..."); // Restart takes quite some time. To skip it, call init() instead of restart()
    modem.restart();

    SerialAT.print("AT+CHFA=1\r\n"); // Swap the audio channels
    delay(2);
    SerialAT.print("AT+CRSL=100\r\n"); //Set ringer sound level
    delay(2);
    SerialAT.print("AT+CLVL=100\r\n"); //Set loud speaker volume level
    delay(2); 
    SerialAT.print("AT+CLIP=1\r\n"); // Calling line identification presentation
    delay(10000);

    Serial.println("CONFIG DONE!");
    digitalWrite(LED_GPIO, LOW);
}

bool call(String number)
{
  digitalWrite(LED_GPIO, HIGH);
  Serial.printf("Calling: %s\n", number);
  bool res = modem.callNumber(number);
  Serial.printf("Call: %s\n", res ? "OK" : "fail");
  if (!res) {
    digitalWrite(LED_GPIO, LOW);
    return false;
  }
  delay(10000); // Hang up after 20 seconds
  res = modem.callHangup();
  DBG("Hang up:", res ? "OK" : "fail");
  digitalWrite(LED_GPIO, LOW);
  return res;
}

String _readSerial() {
  if (SerialAT.available()) {
    return SerialAT.readString();
  }
  return "";
}

void loop()
{
    String s = _readSerial();
    if (s.length() > 0) {
      if (s.indexOf("609558809") > 0 || s.indexOf("732453900") > 0) {
        SerialAT.print("ATH\r\n");
        Serial.println("authorization ok");
        call("+48667672052");
      }
      s = "";
    }
    
}






