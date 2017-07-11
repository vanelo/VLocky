//LCD i2c module address : 0x20 a 0x27 (Por defecto= 0x27)
//mpr121 capacitive touch key pad address : 0x5A-0x5D
#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
//#include <Keypad.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "mpr121.h"

IPAddress server(192, 168, 0, 103);
//const char* wifiSSID = "wifi-test";
//const char* wifiPass = "123456789";
const char* wifiSSID = "Fp_labE";
const char* wifiPass = "link3300";

//TwoWire Wire1 = TwoWire(); //for LCD
//TwoWire Wire2 = TwoWire(); //for keypad
//parametros del lcd: "0x27" significa que no usa pines analogicos (A0=open,A1=open,A2=open) ,"16" (columnas) y "2" (filas)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// const byte numRows = 3; //number of rows on the keypad
// const byte numCols = 3; //number of columns on the keypad

// //keymap defines the key pressed according to the row and columns just as appears on the keypad
// char keymap[numRows][numCols] = {
// 	{'1','2','3'},
// 	{'4','5','6'},
// 	{'7','8','9'},
// 	{'*','0','#'}
// };
int irqpin = 2;  // Digital 2
boolean touchStates[12]; //to keep track of the previous touch states

WiFiClient ESPClient;
PubSubClient client(ESPClient);
/*Code that shows the the keypad connections to the arduino terminals* /
byte rowPins[numRows] = {10, 2, 14}; //Rows 0 to 3 //pin 14
byte colPins[numCols] = {12, 13, 3}; //Columns 0 to

//initializes an instance of the Keypad class
Keypad myKeypad = Keypad(makeKeymap(keymap), rowPins, colPins, numRows, numCols);*/

int cerraduraPin = 0;
int doorSensor = 14;
int new_door_state;
int old_door_state = 0;
int k = 0;
boolean isLcdHigh = false;
char dni[20];
char pass[20];
int dniSize = 0;
int passSize = 0;
int i = 0;
String sDni = "";
String sPass = "";
boolean isDoorClose = true;
unsigned long  lastTransmission;
unsigned long  lastTransmiss;
unsigned long  currentTransmission;
unsigned long  currentTransmiss;
int status = WL_IDLE_STATUS;   // the Wifi radio"s status
int32_t chipId;
char id_puerta[33];
/*Funcion callback que recibe el mensaje del servidor*/
void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonBuffer<200> jsonBuffer; //Crea el buffer donde va ir el string json
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);
  Serial.print("Message: ");
  char data[length]; //no se podria inicializar con data[length]?
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
    data[i] = (char)payload[i];
  }

  Serial.println("");
  //Crea el objeto raiz
  JsonObject& root = jsonBuffer.parseObject(const_cast<char*>(data)); // just removes the constness of it's argument. In other word, it turns the security off.

  //jsonBuffer.clear();//para limpiar el buffer

  // Test if parsing succeeds.
  if (!root.success()) {
    Serial.println("parseObject() failed");
    return;
  }

  String descriptor = root["descriptor"];
  if (descriptor.equals("comando"))
  {
    String comando = root["comando"];
    if (comando.equals("abrir")) {
      lcd.clear();
      lcd.setCursor(0, 0); //setCursor coloca el cursor en la posicion (x,y) del lcd
      lcd.print("¡Adelante!"); //Escribe en el lcd a partir de la posicion (0,0)
      lcd.setCursor(0, 1);
      lcd.print(":)");
      digitalWrite(cerraduraPin, LOW); //abrir la puerta
      Serial.print("comando si es igual a abrir");
      isDoorClose = false;
      //digitalWrite(ledPin, HIGH);
      lastTransmiss = millis(); //guarda el tiempo en que se envió el comando abrir.
      //client.publish(id_puerta, myBuffer);
      StaticJsonBuffer<200> jsonBuffer;                //Crear el buffer donde va ir el string json
      JsonObject& root = jsonBuffer.createObject();        //Crear el objeto raiz -> { }
      root["descriptor"] = "notif";                                 //Crear el objeto "password" dentro de la raiz -> {"descriptor": "autenticacion", "ci": "4561234", "password": "7a89sdf"}
      root["mensaje"] = "comando recibido";
      char myBuffer[200];                                //Crear el buffer de caracteres (que es lo que client.publish() acepta)
      root.printTo(myBuffer, sizeof(myBuffer));                //Convertir el buffer json a un buffer de caracteres y copiar a buffer[200]
      if (client.connect(id_puerta)) {
        client.publish(id_puerta, myBuffer);         //Publicar el mensaje (buffer de caracteres) al canal id_puerta/ agregue mas parametros para el retenido de msj;
      }
    } else {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Incorrecto!");
      lcd.setCursor(0, 1);
      lcd.print(":(");
      Serial.println("No se ha abierto la puerta");
      Serial.print("El comando es: ");
      Serial.println(comando);
    }
  }
}

void doorState() {

  new_door_state = digitalRead(doorSensor);
  if ( new_door_state != old_door_state) {
    StaticJsonBuffer<200> jsonBuffer;                //Crear el buffer donde va ir el string json
    JsonObject& root = jsonBuffer.createObject();        //Crear el objeto raiz -> { }
    root["descriptor"] = "doorState";                //Crear el objeto "descriptor" dentro de la raiz -> {"descriptor": "doorState"}
    root["state"] = new_door_state;                    //Crear el objeto "password" dentro de la raiz -> {"descriptor": "doorState", "state": "close"}
    char myBuffer[200];                                //Crear el buffer de caracteres (que es lo que client.publish() acepta)
    root.printTo(myBuffer, sizeof(myBuffer));                //Convertir el buffer json a un buffer de caracteres y copiar a buffer[200]
    if (client.connect(id_puerta)) {
      client.publish(id_puerta, myBuffer);         //Publicar el mensaje (buffer de caracteres) al canal id_puerta/ agregue mas parametros para el retenido de msj;
    }
    old_door_state = new_door_state;
    //digitalWrite(15, new_door_state);
  }
}
//EthernetClient ethClient;

void wifi_setup() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID, wifiPass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}
void setup()
{
  Serial.begin(115200);
  //Wire1.begin(); //sda 4 scl 5
  //Wire2.begin(); //sda 4 scl 5
  Wire.begin();
  wifi_setup();
  pinMode(cerraduraPin, OUTPUT);
  pinMode(doorSensor, INPUT_PULLUP);
  /*pinMode(15, OUTPUT);*/
  digitalWrite(cerraduraPin, HIGH);
  old_door_state = digitalRead(doorSensor);
  client.setServer(server, 1883);
  client.setCallback(callback);
  chipId = ESP.getChipId(); //returns the ESP8266 chip ID as a 32-bit integer.
  itoa(chipId, id_puerta, 10); //base 10 decimal
  lcd.init();   // initializing the LCD
  lcd.backlight(); // Enable or Turn On the backlight
  //analogWrite(12, 0); //para desactivar PWM en el pin 12
  pinMode(irqpin, INPUT);
  digitalWrite(irqpin, HIGH); //enable pullup resistor
  mpr121_setup();
  Serial.println("setup ready! ");
}

void loop()
{
  if (WiFi.status() == WL_CONNECTED) {

    if (!client.connected())
    {
      lcd.clear(); //Limpiar la pantalla
      lcd.setCursor(0, 0); //Colocar el cursor en la posición (0,0)
      lcd.print("--DESCONECTADO--"); //Imprimir en pantalla
      if (client.connect(id_puerta)) //Comprobar conexión
      {
        client.subscribe(id_puerta); //Subscribir al cliente 
        Serial.println("Conectado a servidor MQTT");
        lcd.clear(); 
        lcd.setCursor(0, 0);
        lcd.print("--CONECTADO--");
      }

    } else {
      client.loop(); //Mantener la comunicación con el servidor
      doorState(); //Conocer si la puerta está abierta o cerrada
      Wire2.begin(4,5); //usar los pines 4 y 5 para la comunicación 
      char key = readTouchInputs(); //conocer la tecla presionada
        if (key == '#' && isLcdHigh == false) {
          lcd.backlight(); // Habilitar/deshabilitar luz de la pantalla
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("ID:");
          lcd.setCursor(0, 1);
          lcd.print(id_puerta);
          isLcdHigh = true;
          Serial.println("inicio del proceso");
        }
        /*Presionar la tecla # para el proceso de entrada de datos*/
        /*Presionar * para hacer el reinicio del proceso de carga de datos
         en el caso de equivocarse en la digitalización*/
        if ((k == 0 && key == '#') || key == '*') {
          //cerar las variables antes de reutilizar
          sDni = "";
          sPass = "";
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("INGRESE SU C.I.:");
          Serial.println("Ingrese su CI: ");
          k = 1;
          i = 0;
        } else if (key != '#' && k == 1 && key != 'x') {
          lcd.setCursor(i, 1);
          lcd.print(key);
          Serial.println(key);
          dni[i] = key;
          i++;
          /*Esta variable se usa para solucionar el problema de borrado de elementos en el 
          array, de este modo solo se guarda en dni los datos ingresados en el proceso actual*/
          dniSize = i;
        } else if (key == '#' && k == 1) {
          k = 2;
          i = 0;
          for (int j = 0; j < dniSize; j++) {
            sDni += dni[j];
          }
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("INGRESE SU PASS:");
          Serial.println("Ingrese su password: ");
        } else if (key != '#' && k == 2 && key != 'x') {
          Serial.println(key);
          lcd.setCursor(i, 1);
          lcd.print("*");
          pass[i] = key;
          i++;
          passSize = i;
        } else if (key == '#' && k == 2) {
          k = 3;
          i = 0;
          for (int j = 0; j < passSize; j++) {
            sPass += pass[j];
          }

        } else if (k == 3) {
          Serial.println("Datos: ");
          Serial.println(sDni);
          Serial.println(sPass);
          Serial.println("Enviando datos");
          StaticJsonBuffer<200> jsonBuffer;      //Crear el buffer donde va ir el string json
          JsonObject& root = jsonBuffer.createObject();   //Crear el objeto raiz -> { }
          root["descriptor"] = "autenticacion";     //Crear el objeto "descriptor" dentro de la raiz -> {"descriptor": "autenticacion"}
          root["dni"] = sDni;     //Crear el objeto "ci" dentro de la raiz -> {"descriptor": "autenticacion", "ci": "4561234"}
          root["pass"] = sPass;   //Crear el objeto "password" dentro de la raiz -> {"descriptor": "autenticacion", "ci": "4561234", "password": "7a89sdf"}
          char myBuffer[200];    //Crear el buffer de caracteres (que es lo que client.publish() acepta)
          root.printTo(myBuffer, sizeof(myBuffer));      //Convertir el buffer json a un buffer de caracteres y copiar a buffer[200]
          if (client.connect(id_puerta)) {
            client.publish(id_puerta, myBuffer);         //Publicar el mensaje (buffer de caracteres) al canal id_puerta/ agregue mas parametros para el retenido de msj;
          }
          k = 0;
        }
      /* vuelve a bloquear la puerta despues de 5 sg.*/
      if (!isDoorClose) {
        currentTransmiss = millis();
        if ((currentTransmiss - lastTransmiss) > 5000) {
          digitalWrite(cerraduraPin, HIGH);
          isDoorClose = true;
        }
      }
      /*condicion para apagar el lcd cuando hay un tiempo x de inactividad*/
      if (checkInterrupt()) {
        lastTransmission = millis();
      }
      currentTransmission = millis();
      if ((currentTransmission - lastTransmission) > 7000) {
        lcd.noBacklight(); 
        k = 0;
        isLcdHigh = false;
      }
    }
  } else {
    wifi_setup();
  }
}

char readTouchInputs() {
  char key = 'x';
  if (!checkInterrupt()) {
    //read the touch state from the MPR121
    Wire.requestFrom(0x5A, 2);

    byte LSB = Wire.read();
    byte MSB = Wire.read();

    uint16_t touched = ((MSB << 8) | LSB); //16bits that make up the touch states

    for (int i = 0; i < 12; i++) { // Check what electrodes were pressed
      if (touched & (1 << i)) {
        if (touchStates[i] == 0) {
          //pin i was just touched
          /*Serial.print("pin ");
          Serial.print(i);
          Serial.println(" was just touched");*/
        } else if (touchStates[i] == 1) {
          //pin i is still being touched
        }
        touchStates[i] = 1;
      } else {
        if (touchStates[i] == 1) {
          //Serial.print("pin ");
          //Serial.print(i);
          if (i == 0) key = '*';
          else if (i == 1) key = '1';
          else if (i == 2) key = '4';
          else if (i == 3) key = '7';
          else if (i == 4) key = '0';
          else if (i == 5) key = '2';
          else if (i == 6) key = '5';
          else if (i == 7) key = '8';
          else if (i == 8) key = '#';
          else if (i == 9) key = '3';
          else if (i == 10) key = '6';
          else if (i == 11) key = '9';
          //Serial.println(" is no longer being touched");

          //pin i is no longer being touched
        }

        touchStates[i] = 0;
      }

    }

  }
  return key;
}




void mpr121_setup(void) {

  set_register(0x5A, ELE_CFG, 0x00);

  // Section A - Controls filtering when data is > baseline.
  set_register(0x5A, MHD_R, 0x01);
  set_register(0x5A, NHD_R, 0x01);
  set_register(0x5A, NCL_R, 0x00);
  set_register(0x5A, FDL_R, 0x00);

  // Section B - Controls filtering when data is < baseline.
  set_register(0x5A, MHD_F, 0x01);
  set_register(0x5A, NHD_F, 0x01);
  set_register(0x5A, NCL_F, 0xFF);
  set_register(0x5A, FDL_F, 0x02);

  // Section C - Sets touch and release thresholds for each electrode
  set_register(0x5A, ELE0_T, TOU_THRESH);
  set_register(0x5A, ELE0_R, REL_THRESH);

  set_register(0x5A, ELE1_T, TOU_THRESH);
  set_register(0x5A, ELE1_R, REL_THRESH);

  set_register(0x5A, ELE2_T, TOU_THRESH);
  set_register(0x5A, ELE2_R, REL_THRESH);

  set_register(0x5A, ELE3_T, TOU_THRESH);
  set_register(0x5A, ELE3_R, REL_THRESH);

  set_register(0x5A, ELE4_T, TOU_THRESH);
  set_register(0x5A, ELE4_R, REL_THRESH);

  set_register(0x5A, ELE5_T, TOU_THRESH);
  set_register(0x5A, ELE5_R, REL_THRESH);

  set_register(0x5A, ELE6_T, TOU_THRESH);
  set_register(0x5A, ELE6_R, REL_THRESH);

  set_register(0x5A, ELE7_T, TOU_THRESH);
  set_register(0x5A, ELE7_R, REL_THRESH);

  set_register(0x5A, ELE8_T, TOU_THRESH);
  set_register(0x5A, ELE8_R, REL_THRESH);

  set_register(0x5A, ELE9_T, TOU_THRESH);
  set_register(0x5A, ELE9_R, REL_THRESH);

  set_register(0x5A, ELE10_T, TOU_THRESH);
  set_register(0x5A, ELE10_R, REL_THRESH);

  set_register(0x5A, ELE11_T, TOU_THRESH);
  set_register(0x5A, ELE11_R, REL_THRESH);

  // Section D
  // Set the Filter Configuration
  // Set ESI2
  set_register(0x5A, FIL_CFG, 0x04);

  // Section E
  // Electrode Configuration
  // Set ELE_CFG to 0x00 to return to standby mode
  set_register(0x5A, ELE_CFG, 0x0C);  // Enables all 12 Electrodes


  // Section F
  // Enable Auto Config and auto Reconfig
  /*set_register(0x5A, ATO_CFG0, 0x0B);
  set_register(0x5A, ATO_CFGU, 0xC9);  // USL = (Vdd-0.7)/vdd*256 = 0xC9 @3.3V   set_register(0x5A, ATO_CFGL, 0x82);  // LSL = 0.65*USL = 0x82 @3.3V
  set_register(0x5A, ATO_CFGT, 0xB5);*/  // Target = 0.9*USL = 0xB5 @3.3V

  set_register(0x5A, ELE_CFG, 0x0C);

}


boolean checkInterrupt(void) {
  return digitalRead(irqpin);
}


void set_register(int address, unsigned char r, unsigned char v) {
  Wire.beginTransmission(address);
  Wire.write(r);
  Wire.write(v);
  Wire.endTransmission();
}
