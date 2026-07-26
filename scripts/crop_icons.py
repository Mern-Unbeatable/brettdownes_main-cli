from PIL import Image
from pathlib import Path

src = Path(r"C:\Users\User\.cursor\projects\d-Office-mern-client-work-brettdownes-peptide\assets\c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_c7264f619a7bd3a8a680d46fe43ad2df_images_image-82e2d13a-14a5-4a70-85a7-121e062ab249.png")
out = Path(r"D:\Office\mern\client work\brettdownes-peptide\public\images")
im = Image.open(src).convert("RGBA")

crops = {
    "molecule": (52, 58, 88, 94),
    "dna": (305, 42, 375, 112),
    "target": (550, 42, 620, 112),
    "leaf": (815, 42, 885, 112),
}

for name, box in crops.items():
    crop = im.crop(box)
    big = crop.resize((crop.width * 4, crop.height * 4), Image.Resampling.LANCZOS)
    big.save(out / f"icon-{name}.png")
    print(name, big.size)
