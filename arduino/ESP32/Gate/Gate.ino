// Configure TinyGSM library
#define TINY_GSM_MODEM_SIM800          // Modem is SIM800
#define TINY_GSM_RX_BUFFER      1024   // Set RX buffer to 1Kb

#include "config.h"
#include "utilities.h"
#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <TinyGsmClient.h>

#define SerialAT Serial1

// #define DUMP_AT_COMMANDS
#ifdef DUMP_AT_COMMANDS
#include <StreamDebugger.h>
StreamDebugger debugger(SerialAT, Serial);
TinyGsm modem(debugger);
#else
TinyGsm modem(SerialAT);
#endif

WebServer server(80);
unsigned long hangupAt = 0;

void setup()
{
    pinMode(LED_GPIO, OUTPUT);
    digitalWrite(LED_GPIO, HIGH);
    Serial.begin(115200); delay(10);
    initGSM();
    initWifi();
    initWebServer();
    digitalWrite(LED_GPIO, LOW);

    Serial.print("CALL_TARGET: "); Serial.println(CALL_TARGET);
    Serial.print("AUTH1: "); Serial.println(AUTH1);
    Serial.print("AUTH2: "); Serial.println(AUTH2);
}

void initGSM()
{
    setupModem();
    SerialAT.begin(SERIAL_BR, SERIAL_8N1, MODEM_RX, MODEM_TX); delay(1000);
    Serial.println("Initializing modem..."); // Restart takes quite some time. To skip it, call init() instead of restart()
    modem.restart();
    Serial.println("CONFIG GSM DONE!");
}

void initWifi()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.printf("Connected to %s\n", WIFI_SSID);
  Serial.println("CONFIG WIFI DONE!");
}

void initWebServer()
{
  if (!MDNS.begin(HOSTNAME)) {
    Serial.println("Error setting up MDNS responder!");
    ESP.restart();
  } else {
    Serial.printf("Set up MDNS responder at host: %s\n", HOSTNAME);
  }
  MDNS.addService("http", "tcp", 80);

  server.on("/", handleRoot);
  server.on("/open", handleOpen);
  server.on("/status", handleStatus);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("CONFIG HTTP SERVER DONE!");
}

void handleOpen()
{
  if (hangupAt == 0) {
    server.send(200, "application/json", "[200]");
    gate();
  } else {
    server.send(226, "application/json", "[226]");
  }
}

void handleStatus()
{
  server.send(
    hangupAt == 0 ? 200 : 226,
    "application/json",
    hangupAt > 0 ? "[226]" : "[200]"
  );
}

void handleRoot()
{
  server.send(
    200,
    "application/json",
    hangupAt > 0 ? "{\"opening\": true}" : "{\"opening\": false}"
  );
}

void handleNotFound()
{
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
}

bool gate()
{
  hangupAt = millis();

  digitalWrite(LED_GPIO, HIGH);
  Serial.printf("Calling: %s\n", CALL_TARGET);
  bool res = modem.callNumber(CALL_TARGET);
  if (!res) {
    Serial.println("Error :(");
  }
  digitalWrite(LED_GPIO, LOW);
  return res;
}

void hangup()
{
  // SerialAT.print("ATH\r\n");
  bool res = modem.callHangup();
  Serial.printf("...hangup: %s\n", res ? "ok" : "error");
}

void receive()
{
  if (SerialAT.available()) {
    String s = "";
    s = SerialAT.readString();
    
    if (s.length() > 0) {
      if (s.indexOf("RING") > 0) {
        hangup();
        if (s.indexOf(AUTH1) > 0 || s.indexOf(AUTH2) > 0) {
          gate();
        }
      }
    }    
  }
}

void loop()
{
  receive();
  server.handleClient();

  unsigned long current = millis();
  if (hangupAt != 0 && hangupAt + OPEN_TIME < current) {
    hangupAt = 0;
    hangup();
  }
}





