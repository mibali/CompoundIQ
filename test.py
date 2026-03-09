
import base64


# 1. Your credentials

api_key = "32007505ZaHALDkcCyffXmwobxSgIYgrtsfdm"

api_secret = "fY1gSH0P4rnDyz4UHXEZsPI9UhuCJ8_fOgH92j-bQLo"


# 2. Combine them into a single string

credentials_string = f"{api_key}:{api_secret}"


# 3. Encode the string to bytes, then Base64 encode it

encoded_credentials = base64.b64encode(credentials_string.encode('utf-8')).decode('utf-8')


# 4. The final header value

auth_header = f"Basic {encoded_credentials}"


print(auth_header)
