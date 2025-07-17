import os
from groq import Groq
from google.cloud import translate_v2 as translate
from dotenv import load_dotenv

load_dotenv() 

groq_key = os.getenv('groqclient')

# Set Google Application Credentials from environment or default filename
google_creds_file = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'indiapost-439216-6a03ba3d322b.json')
google_creds_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), google_creds_file)
if os.path.exists(google_creds_path):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_creds_path

client = Groq(api_key=groq_key)
# Use relative path for audio file
filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "downloaded_audio.mp3")

transcribed_text = ""

# Transcribe the audio file
with open(filename, "rb") as file:
    transcription = client.audio.transcriptions.create(
      file=(filename, file.read()),
      model="whisper-large-v3-turbo",
      response_format="verbose_json",
    )
    transcribed_text = transcription.text

#save the transcribed text to a file    
with open("transcribed_text.txt", "w") as file: 
    file.write(transcribed_text)
    file.close()

# Translate the transcribed text to a different language
with open("transcribed_text.txt", "r", encoding="utf-8") as file:
    transcribed_text = file.read() 
translate_client = translate.Client()
result = translate_client.translate(transcribed_text, target_language="fr",format_="text")
translated_text = result["translatedText"]

#save the translated text to a file
with open("translated_text.txt", "w",encoding="utf-8") as file:
    file.write(translated_text)
    file.close()

print(result["translatedText"])
