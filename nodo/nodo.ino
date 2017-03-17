#include <SPI.h>
#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <Keypad.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
IPAddress server(192,168,0,103);
const char* wifiSSID = "dlink";
const char* wifiPass = "geardos123";

//parametros del lcd: "0x27" significa que no usa pines analogicos (A0=open,A1=open,A2=open) ,"16" (columnas) y "2" (filas)
LiquidCrystal_I2C lcd(0x27, 16, 2);

const byte numRows = 4; //number of rows on the keypad
const byte numCols = 3; //number of columns on the keypad

//keymap defines the key pressed according to the row and columns just as appears on the keypad
char keymap[numRows][numCols] = {
	{'1','2','3'},
	{'4','5','6'},
	{'7','8','9'},
	{'*','0','#'}
};
WiFiClient ESPClient;
PubSubClient client(ESPClient);
/*Code that shows the the keypad connections to the arduino terminals*/
byte rowPins[numRows] = {16, 10, 2, 14}; //Rows 0 to 3
byte colPins[numCols] = {12, 13, 3}; //Columns 0 to

//initializes an instance of the Keypad class
Keypad myKeypad = Keypad(makeKeymap(keymap), rowPins, colPins, numRows, numCols);

int cerraduraPin = 0;
//int ledPin = 15;
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
	StaticJsonBuffer<400> jsonBuffer; //Crea el buffer donde va ir el string json
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
		if(comando.equals("abrir")) {
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
	wifi_setup();
	pinMode(cerraduraPin, OUTPUT);
	//pinMode(ledPin, OUTPUT);
	digitalWrite(cerraduraPin, HIGH);
	//digitalWrite(ledPin, LOW);
	client.setServer(server, 1883);
	client.setCallback(callback);
	chipId = ESP.getChipId(); //returns the ESP8266 chip ID as a 32-bit integer.
	itoa(chipId, id_puerta, 10); //base 10 decimal
	lcd.init();   // initializing the LCD
	lcd.backlight(); // Enable or Turn On the backlight
	Serial.println("setup ready! ");
  analogWrite(12, 0); //para desactivar PWM en el pin 12
}

void loop()
{
	if (WiFi.status() == WL_CONNECTED) {
		
    if (!client.connected())
		{
			lcd.clear();
			lcd.setCursor(0, 0);
			lcd.print("--DESCONECTADO--");
			if (client.connect(id_puerta))
			{
				client.subscribe(id_puerta);
				Serial.println("Conectado a servidor MQTT");
				lcd.clear();
				lcd.setCursor(0, 0);
				lcd.print("--CONECTADO--");
			}

		} else {
			client.loop(); //ejecutar esta funcion cuando conecta al servidor
			char key = myKeypad.getKey();
			/* Al apretar cualquier tecla se prende la pantalla y muestra la id de la puerta*/
			if (key == '#' && isLcdHigh == false) {
				lcd.backlight(); // Enable or Turn On the backlight
				lcd.clear();
				lcd.setCursor(0, 0);
				lcd.print("ID:");
				lcd.setCursor(0, 1);
				lcd.print(id_puerta);
				isLcdHigh = true;

        Serial.println("inicio del proceso");
			}

			/*Al presionar la tecla # para el proceso de entrada de datos*/
			if (k == 0 && key == '#') {
				//importantisimo cerar las variables para volver a utilizar
				sDni = "";
				sPass = "";
				lcd.clear();
				lcd.setCursor(0, 0);
				lcd.print("INGRESE SU DNI: ");
				Serial.println("Ingrese su dni: ");
				k = 1;

			} else if (key != NO_KEY && key != '#' && k == 1) {
				lcd.setCursor(i, 1);
				lcd.print(key);
				Serial.println(key);
				dni[i] = key;
				i++;
				/*Esta variable se usa para solucionar el problema de borrado de elementos en el array pues de este modo solo se guarda en el String dni los datos ingresados en el proceso actual*/
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
			} else if (key != NO_KEY && key != '#' && k == 2) {
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
				StaticJsonBuffer<400> jsonBuffer;                //Crear el buffer donde va ir el string json
				JsonObject& root = jsonBuffer.createObject();        //Crear el objeto raiz -> { }
				root["descriptor"] = "autenticacion";                //Crear el objeto "descriptor" dentro de la raiz -> {"descriptor": "autenticacion"}
				root["dni"] = sDni;                            //Crear el objeto "ci" dentro de la raiz -> {"descriptor": "autenticacion", "ci": "4561234"}
				root["pass"] = sPass;                    //Crear el objeto "password" dentro de la raiz -> {"descriptor": "autenticacion", "ci": "4561234", "password": "7a89sdf"}
				char myBuffer[400];                                //Crear el buffer de caracteres (que es lo que client.publish() acepta)
				root.printTo(myBuffer, sizeof(myBuffer));                //Convertir el buffer json a un buffer de caracteres y copiar a buffer[200]
				if (client.connect(id_puerta)) {
					client.publish(id_puerta, myBuffer);         //Publicar el mensaje (buffer de caracteres) al canal id_puerta/ agregue mas parametros para el retenido de msj;
				}
				k = 0;
			}
			/* vuelve a trancar la puerta despues de 5 sg.*/
			if (!isDoorClose) {
				currentTransmiss = millis();
				if ((currentTransmiss - lastTransmiss) > 5000) {
					digitalWrite(cerraduraPin, HIGH);
					//digitalWrite(ledPin, LOW);
					isDoorClose = true;
				}
			}
			/*condicion para apagar el lcd cuando hay un tiempo x de inactividad*/
			if (key != NO_KEY) {
				lastTransmission = millis();
			}
			currentTransmission = millis();
			if ((currentTransmission - lastTransmission) > 7000) {
				lcd.noBacklight(); // Enable or Turn Off the backlight
				k = 0;
				isLcdHigh = false;
			}
		}
	} else {
		wifi_setup();
	}
}
