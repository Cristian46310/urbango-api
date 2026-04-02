
import asyncio
import base64
import mimetypes
import os
import pickle
from email.message import EmailMessage
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email.mime.text import MIMEText

from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from dotenv import load_dotenv

from app.DTOs import EmailDTO

load_dotenv()


class EmailService:
    def __init__(self) -> None:
        self.creds = None
        self.SCOPES = str(os.getenv("SCOPES")).split(";")
        self.secrets_location = str(os.getenv("SECRETS_LOCATION"))
        self.email = str(os.getenv("EMAIL"))
        self.client_secret = str(os.getenv("CLIENT_SECRET"))
        self._load_credentials()

    def _load_credentials(self) -> None:
        """Cargar credenciales OAuth de Google."""
        creds = None
        token_path = f"{self.secrets_location}/token.pickle"

        # Cargar credenciales si ya existen
        if os.path.exists(token_path):
            with open(token_path, "rb") as token:
                creds = pickle.load(token)

        # Si no hay credenciales válidas, iniciar flujo OAuth
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                secrets_file = f"{self.secrets_location}/{self.client_secret}"
                flow = InstalledAppFlow.from_client_secrets_file(
                    secrets_file,
                    self.SCOPES,
                )
                creds = flow.run_local_server(port=0)

            with open(token_path, "wb") as token:
                pickle.dump(creds, token)

        self.creds = creds

    def _build_file_part(self, file_path: str):
        """Construye una parte MIME para un archivo adjunto."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo no encontrado: {file_path}")

        content_type, encoding = mimetypes.guess_type(file_path)

        if content_type is None or encoding is not None:
            content_type = "application/octet-stream"

        main_type, sub_type = content_type.split("/", 1)

        with open(file_path, "rb") as fp:
            file_data = fp.read()

        if main_type == "text":
            msg = MIMEText(file_data.decode("utf-8"), _subtype=sub_type)
        elif main_type == "image":
            msg = MIMEImage(file_data, _subtype=sub_type)
        elif main_type == "audio":
            msg = MIMEAudio(file_data, _subtype=sub_type)
        else:
            msg = MIMEBase(main_type, sub_type)
            msg.set_payload(file_data)

        filename = os.path.basename(file_path)
        msg.add_header("Content-Disposition", "attachment", filename=filename)
        return msg

    def _create_message(self, email_dto: EmailDTO) -> dict:
        """Crea un mensaje de correo con o sin archivos adjuntos."""
        message = EmailMessage()
        message["To"] = email_dto.to
        message["From"] = self.email
        message["Subject"] = email_dto.subject
        message.set_content(email_dto.body)

        # Agregar archivos adjuntos si existen
        if email_dto.files:
            for file_path in email_dto.files:
                try:
                    content_type, encoding = mimetypes.guess_type(file_path)

                    if content_type is None or encoding is not None:
                        content_type = "application/octet-stream"

                    main_type, sub_type = content_type.split("/", 1)

                    with open(file_path, "rb") as fp:
                        file_data = fp.read()

                    filename = os.path.basename(file_path)
                    message.add_attachment(file_data, maintype=main_type, subtype=sub_type, filename=filename)
                except FileNotFoundError as e:
                    raise FileNotFoundError(f"Archivo no encontrado: {file_path}") from e

        # Codificar el mensaje en base64
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return {"raw": encoded_message}

    async def send_email(self, email_dto: EmailDTO) -> dict:
        """Envía un correo electrónico con o sin archivos adjuntos de forma asincrónica."""
        try:
            # Ejecutar operación bloqueante en thread separado
            result = await asyncio.to_thread(self._send_email_sync, email_dto)
            return result

        except Exception as error:
            print(f"Error inesperado: {error}")
            return {"success": False, "error": str(error)}

    def _send_email_sync(self, email_dto: EmailDTO) -> dict:
        """Método sincrónico que realiza el envío (ejecutado en thread separado)."""
        try:
            service = build("gmail", "v1", credentials=self.creds)
            message = self._create_message(email_dto)

            sent_message = (
                service.users()
                .messages()
                .send(userId="me", body=message)
                .execute()
            )

            print(f"Correo enviado exitosamente. Message Id: {sent_message['id']}")
            return {"success": True, "message_id": sent_message["id"]}

        except HttpError as error:
            print(f"Error de Google API: {error}")
            return {"success": False, "error": str(error)}
        except FileNotFoundError as error:
            print(f"Error de archivo: {error}")
            return {"success": False, "error": str(error)}