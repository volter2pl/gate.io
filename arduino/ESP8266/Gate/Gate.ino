/*
 * Based on: https://github.com/Links2004/arduinoWebSockets
 * /blob/master/examples/esp8266/WebSocketClientSocketIO/WebSocketClientSocketIO.ino
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WebSocketsClient.h>
#include <Hash.h>
#include "config.h"

ESP8266WiFiMulti WiFiMulti;
WebSocketsClient webSocket;

#define RELAY D1 //Pin to which is attached a relay
#define BUZZER D8 //Pin to which is attached a buzzer
#define MESSAGE_INTERVAL 5000
#define HEARTBEAT_INTERVAL 25000
#define MAX_OPPENING_INTERVAL 10000
#define MIN_OPPENING_INTERVAL 1000

uint64_t messageTimestamp = 0;
uint64_t heartbeatTimestamp = 0;
uint64_t openingTimestamp = 0;
uint64_t forceGateEndAt = 0;
bool isConnected = false;
bool isOpening = false;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t lenght) {
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
                 openGateStart();
             }
             if (strcmp((char *)payload, "OPEN_GATE_END_REQUEST") == 0) {
                 openGateEnd();
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

void openGateStart() {
  openingTimestamp = millis();
  webSocket.sendTXT("OPEN_GATE_START_RESPONSE");
  ledOn();
  digitalWrite(RELAY, HIGH);
  isOpening = true;
}

void openGateEnd() {
  if (openingTimestamp == 0 && forceGateEndAt == 0) {
      // Jeśli przycisk jest zwolniony to nic nie trzeba robić
      webSocket.sendTXT("OPEN_GATE_END_RESPONSE");
  } else if (openingTimestamp > 0 && (millis() - openingTimestamp) > MIN_OPPENING_INTERVAL) {
      // Jeśli otwieramy i minął czas minimalnego otwarcia to możemy zwolnić
      openGateEndHard();
  } else if (forceGateEndAt == 0 && openingTimestamp > 0) {
      // Jeśli przycisk został przytrzymany z krótko to ustaw czas zamknięcia i wyślij sygnał że nadal otwieramy
      webSocket.sendTXT("OPEN_GATE_START_RESPONSE");
      forceGateEndAt = millis() + MIN_OPPENING_INTERVAL;
  } else {
      if (isOpening) {
          webSocket.sendTXT("OPEN_GATE_START_RESPONSE");
      } else {
          webSocket.sendTXT("OPEN_GATE_END_RESPONSE");
      }
  }
}

void openGateEndHard() {
      openingTimestamp = 0;
      forceGateEndAt = 0;
      webSocket.sendTXT("OPEN_GATE_END_RESPONSE");
      digitalWrite(RELAY, LOW);
      ledOff(); 
      isOpening = false; 
}

void ledOn() {
  digitalWrite(BUILTIN_LED, LOW);
}

void ledOff() {
  digitalWrite(BUILTIN_LED, HIGH);
}

void setup() {
    Serial.begin(9600);
    pinMode(BUILTIN_LED, OUTPUT);
    ledOn();

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

    ledOff();
}

void loop() {
    webSocket.loop();
    uint64_t now = millis();
    if (openingTimestamp > 0 && (now - openingTimestamp) > MAX_OPPENING_INTERVAL) {
        Serial.println("timeout");
        openGateEndHard();
    }

    if (forceGateEndAt > 0 && now > forceGateEndAt) {
        Serial.println("time to release");
        openGateEndHard();
    }

    if (isConnected) {
        if((now - heartbeatTimestamp) > HEARTBEAT_INTERVAL) {
            heartbeatTimestamp = now;
            webSocket.sendTXT("2"); // heartbeat message
        }
    }

    if (isOpening) {
        int freq = 500;
        tone(BUZZER, freq);
    } else {
        noTone(BUZZER);
    }
}
