"""Generate the local QR asset; no third-party QR service is required."""
from pathlib import Path
import qrcode

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=4)
qr.add_data('https://nkweather.top/game')
qr.make(fit=True)
qr.make_image(fill_color='black', back_color='white').save(Path(__file__).resolve().parents[1] / 'public' / 'game-qr.png')
