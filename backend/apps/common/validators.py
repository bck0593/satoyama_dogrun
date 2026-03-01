from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def validate_image_size(file_obj):
    if not file_obj:
        return
    if file_obj.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError("画像サイズは5MB以下にしてください。")


def validate_image_extension(file_obj):
    if not file_obj or "." not in file_obj.name:
        return
    extension = file_obj.name.rsplit(".", 1)[1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError("対応画像形式は jpg / jpeg / png / webp のみです。")
