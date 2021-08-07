/*
 * Based on: https://github.com/Links2004/arduinoWebSockets
 * /blob/master/examples/esp8266/WebSocketClientSocketIO/WebSocketClientSocketIO.ino
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ESP8266mDNS.h>

#include <WebSocketsClient.h>
#include <Hash.h>
#include "config.h"

ESP8266WiFiMulti WiFiMulti;
WebSocketsClient webSocket;

WiFiClient client;
HTTPClient http;

#define RELAY D1 //Pin to which is attached a relay
#define BUZZER D8 //Pin to which is attached a buzzer
#define MESSAGE_INTERVAL 5000
#define HEARTBEAT_INTERVAL 25000
#define TARGET_HOSTNAME "gategsm"

// uint64_t messageTimestamp = 0;
uint64_t heartbeatTimestamp = 0;
// uint64_t openingTimestamp = 0;
// uint64_t forceGateEndAt = 0;
bool isConnected = false;
bool isOpening = false;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t lenght)
{
  switch(type) {
    case WStype_DISCONNECTED:
       Serial.printf("[WSc] Disconnected!\n");
       isConnected = false;
       setup();
       break;
    case WStype_CONNECTED:
       Serial.printf("[WSc] Connected to url: %s\n",  payload);
       isConnected = true;
       // send message to server when Connected
       // socket.io upgrade confirmation message (required)
       webSocket.sendTXT("5");
       break;
    case WStype_TEXT:
      Serial.printf("[WSc] get text: %s\n", payload);
      if (strcmp((char *)payload, "OPEN_GATE_START_REQUEST") == 0) {
        open();
      }
      if (strcmp((char *)payload, "OPEN_GATE_END_REQUEST") == 0) {
        // do norhing
      }
      break;
    case WStype_BIN:
      Serial.printf("[WSc] get binary lenght: %u\n", lenght);
      hexdump(payload, lenght);
      // send data to server
      // webSocket.sendBIN(payload, lenght);
      break;
  }
}

void start()
{
  isOpening = true;
  tone(BUZZER, 500);
  webSocket.sendTXT("OPEN_GATE_START_RESPONSE");
  digitalWrite(BUILTIN_LED, LOW);
  digitalWrite(RELAY, HIGH);
}

void end()
{
  isOpening = false;
  noTone(BUZZER);
  webSocket.sendTXT("OPEN_GATE_END_RESPONSE");
  digitalWrite(BUILTIN_LED, HIGH);
  digitalWrite(RELAY, LOW);
}

void setup()
{
  Serial.begin(9600);
  pinMode(BUILTIN_LED, OUTPUT);
  digitalWrite(BUILTIN_LED, LOW); // led on

  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, LOW);

  pinMode(BUZZER, OUTPUT);

  for(uint8_t t = 4; t > 0; t--) {
    Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }
  WiFiMulti.addAP(wifi_ssid, wifi_pass);
  //WiFi.disconnect();

  while(WiFiMulti.run() != WL_CONNECTED) {
    delay(100);
  }

  webSocket.begin(ws_host, ws_port);
  webSocket.setAuthorization(ws_user, ws_pass);
  webSocket.onEvent(webSocketEvent);

  digitalWrite(BUILTIN_LED, HIGH); // led off
}

void open()
{
  if (isOpening) {
    Serial.printf("gate is already opening");
    return;
  }
  
  
  IPAddress ipaddr;
  int err = WiFi.hostByName("gategsm", ipaddr) ;
  if(err == 1){
        Serial.print("Ip address: ");
        Serial.println(ipaddr);
  } else {
        Serial.print("Error code: ");
        Serial.println(err);
        return;
  }

  start();
  if (http.begin(client, String("http://") + ipaddr.toString() + "/open")) {
    int status = http.GET();
    http.end();
    if (status == 200) {
      int i = 20;
      while (i--) {
        isOpening = getIsOpening();
        if (!isOpening) {
          break;
        }
        delay(1000);
      }
    } else {
      Serial.printf("[HTTP} GET request http://gategsm/open, status = %d\n", status);
    }
  } else {
    Serial.printf("[HTTP} Unable to connect http://gategsm/open\n");
  }
  end();
}

bool getIsOpening()
{
  if (http.begin(client, "http://gategsm/status")) {
    int status = http.GET();
    Serial.printf("[HTTP} GET request http://gategsm/status, status = %d\n", status);
    http.end();
    return status == 226;
  } else {
    return false;
  }
}

void loop()
{
  webSocket.loop();

  uint64_t now = millis();
  if (isConnected) {
    if((now - heartbeatTimestamp) > HEARTBEAT_INTERVAL) {
      heartbeatTimestamp = now;
      webSocket.sendTXT("2"); // heartbeat message
    }
  }
}
