"""Paint the five moon-court elves. Illustrated, not photographic."""

from PIL import Image, ImageDraw, ImageFilter

W, H = 720, 1080


def bez(a, b, c, n=28):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]))
    return pts


def cubic(a, b, c, d, n=32):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append(
            (
                u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
                u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
            )
        )
    return pts


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + ((a[3] if len(a) > 3 else 255),)


def gown_poly(cx, hem, flare, shoulder, waist):
    left = cubic((cx - shoulder, 430), (cx - waist, 560), (cx - flare * 0.72, 760), (cx - flare, hem))
    right = cubic((cx + flare, hem), (cx + flare * 0.72, 760), (cx + waist, 560), (cx + shoulder, 430))
    return left + right


def eye(d, x, y, iris, liner):
    d.polygon([(x - 22, y), (x - 8, y - 11), (x + 20, y - 1), (x + 8, y + 10), (x - 10, y + 9)], fill=(248, 242, 236, 255))
    d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=iris)
    d.ellipse((x - 4, y - 4, x + 5, y + 5), fill=(18, 12, 16, 255))
    d.ellipse((x - 6, y - 6, x - 2, y - 2), fill=(255, 255, 255, 240))
    d.line([(x - 20, y - 1), (x - 4, y - 10), (x + 18, y - 2)], fill=liner, width=3)


def brow(d, x, y, color, lift=0):
    d.line([(x - 20, y + 4), (x - 4, y - 6 - lift), (x + 16, y - 1)], fill=color, width=3)


def face(hy_unused, cx, hy, shade):
    blush = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blush)
    bd.ellipse((cx - 62, hy + 18, cx - 18, hy + 58), fill=(180, 90, 90, 70))
    bd.ellipse((cx + 18, hy + 18, cx + 62, hy + 58), fill=(180, 90, 90, 70))
    bd.polygon([(cx - 16, hy + 8), (cx, hy + 46), (cx + 16, hy + 8), (cx, hy + 18)], fill=shade + (90,))
    blush = blush.filter(ImageFilter.GaussianBlur(6))
    return blush


def ears(d, cx, hy, skin, inner):
    for s in (-1, 1):
        d.polygon(
            [(cx + s * 62, hy - 10), (cx + s * 108, hy - 36), (cx + s * 118, hy - 8), (cx + s * 70, hy + 36), (cx + s * 58, hy + 8)],
            fill=skin,
        )
        d.polygon([(cx + s * 74, hy - 4), (cx + s * 102, hy - 16), (cx + s * 78, hy + 22)], fill=inner)


def hair_cap(d, cx, hy, color, style):
    d.ellipse((cx - 86, hy - 118, cx + 86, hy + 20), fill=color)
    if style == "sheet":
        d.polygon([(cx - 78, hy - 20), (cx - 108, hy + 420), (cx - 36, hy + 390), (cx - 48, hy + 10)], fill=color)
        d.polygon([(cx + 48, hy + 10), (cx + 36, hy + 390), (cx + 108, hy + 420), (cx + 78, hy - 20)], fill=color)
    elif style == "braid":
        d.polygon([(cx - 70, hy - 10), (cx - 96, hy + 80), (cx - 40, hy + 40)], fill=color)
        y = hy + 20
        x = cx + 78
        for i in range(9):
            d.ellipse((x - 16, y, x + 18, y + 36), fill=color)
            y += 28
            x += 2 if i % 2 == 0 else -2
        d.ellipse((x - 10, y - 8, x + 14, y + 18), fill=mix(color, (212, 168, 74), 0.45))
    elif style == "waves":
        left = cubic((cx - 70, hy - 30), (cx - 130, hy + 80), (cx - 60, hy + 220), (cx - 120, hy + 380))
        right_edge = cubic((cx - 40, hy + 360), (cx - 20, hy + 200), (cx - 70, hy + 60), (cx - 40, hy - 10))
        d.polygon(left + right_edge, fill=color)
        left = cubic((cx + 40, hy - 10), (cx + 70, hy + 60), (cx + 20, hy + 200), (cx + 40, hy + 360))
        right_edge = cubic((cx + 120, hy + 380), (cx + 60, hy + 220), (cx + 130, hy + 80), (cx + 70, hy - 30))
        d.polygon(left + right_edge, fill=color)
    elif style == "sleek":
        d.polygon([(cx - 78, hy - 40), (cx - 92, hy + 280), (cx - 48, hy + 300), (cx - 40, hy)], fill=color)
        d.polygon([(cx + 40, hy), (cx + 36, hy + 240), (cx + 18, hy + 360), (cx + 48, hy + 200), (cx + 86, hy - 20)], fill=color)
        d.polygon([(cx - 8, hy - 70), (cx + 18, hy + 10), (cx + 8, hy + 220), (cx - 6, hy + 200)], fill=(22, 18, 20, 255))
    elif style == "loose":
        d.polygon([(cx - 80, hy - 40), (cx - 140, hy + 160), (cx - 70, hy + 300), (cx - 36, hy + 40)], fill=color)
        d.polygon([(cx + 36, hy + 40), (cx + 80, hy + 280), (cx + 150, hy + 140), (cx + 78, hy - 50)], fill=color)


def paint(spec):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, hy = W // 2, 300
    skin = spec["skin"]
    shade = spec["shade"]
    hair = spec["hair"]
    gown = spec["gown"]
    trim = spec["trim"]
    if spec.get("cloak"):
        cloak = spec["cloak"]
        d.polygon([(cx - 40, 400), (cx - 210, 860), (cx - 120, 980), (cx + 120, 980), (cx + 210, 860), (cx + 40, 400)], fill=cloak)
        d.polygon([(cx - 30, 390), (cx - 160, 470), (cx - 40, 500)], fill=cloak)
        d.polygon([(cx + 30, 390), (cx + 160, 470), (cx + 40, 500)], fill=cloak)
    style = spec.get("style", "gown")
    if style == "coat":
        d.polygon([(cx - 70, 470), (cx - 48, 860), (cx - 16, 860), (cx - 24, 500)], fill=spec["leg"])
        d.polygon([(cx + 24, 500), (cx + 16, 860), (cx + 48, 860), (cx + 70, 470)], fill=spec["leg"])
        d.rounded_rectangle((cx - 52, 820, cx - 12, 930), radius=8, fill=spec["boot"])
        d.rounded_rectangle((cx + 12, 820, cx + 52, 930), radius=8, fill=spec["boot"])
        body = gown_poly(cx, 780, 150, 96, 70)
        d.polygon(body, fill=gown)
        d.polygon([(cx - 18, 430), (cx, 560), (cx + 18, 430)], fill=trim)
        d.polygon([(cx - 108, 430), (cx - 150, 620), (cx - 108, 600), (cx - 78, 450)], fill=gown)
        d.polygon([(cx + 78, 450), (cx + 108, 600), (cx + 150, 620), (cx + 108, 430)], fill=gown)
    else:
        body = gown_poly(cx, 980, spec.get("flare", 168), 92, 58)
        d.polygon(body, fill=gown, outline=trim)
        d.line(cubic((cx - 70, 470), (cx - 20, 700), (cx - 10, 860), (cx, 980)), fill=trim, width=3)
        d.polygon([(cx - 100, 430), (cx - 150, 640), (cx - 112, 650), (cx - 70, 470)], fill=gown)
        d.polygon([(cx + 70, 470), (cx + 112, 650), (cx + 150, 640), (cx + 100, 430)], fill=gown)
        d.ellipse((cx - 36, 940, cx - 4, 970), fill=spec.get("boot", (28, 24, 26, 255)))
        d.ellipse((cx + 4, 940, cx + 36, 970), fill=spec.get("boot", (28, 24, 26, 255)))
    d.polygon([(cx - 16, hy + 96), (cx - 22, 460), (cx + 22, 460), (cx + 16, hy + 96)], fill=skin)
    hair_cap(d, cx, hy, hair, spec["hair_style"])
    d.ellipse((cx - 74, hy - 96, cx + 74, hy + 108), fill=skin)
    features = face(0, cx, hy, shade)
    eye(d, cx - 28, hy - 8, spec["iris"], spec["liner"])
    eye(d, cx + 28, hy - 8, spec["iris"], spec["liner"])
    brow(d, cx - 28, hy - 28, spec["brow"], spec.get("lift", 0))
    brow(d, cx + 28, hy - 28, spec["brow"], spec.get("lift", 0))
    d.line([(cx, hy + 6), (cx - 2, hy + 28)], fill=shade + (255,), width=2)
    d.arc((cx - 8, hy + 24, cx + 8, hy + 36), 20, 160, fill=shade + (255,), width=2)
    d.ellipse((cx - 14, hy + 44, cx + 14, hy + 58), fill=spec["lip"])
    d.ellipse((cx - 8, hy + 46, cx + 8, hy + 52), fill=mix(spec["lip"], (255, 220, 210), 0.45))
    if spec.get("freckles"):
        for i, (dx, dy) in enumerate(((-18, 22), (-8, 28), (10, 24), (20, 30), (-24, 34), (6, 36))):
            d.ellipse((cx + dx, hy + dy, cx + dx + 3, hy + dy + 3), fill=shade + (180,))
    # fringe so the hairline meets the face without covering the eyes
    if spec["hair_style"] == "sheet":
        d.polygon([(cx - 70, hy - 90), (cx, hy - 20), (cx + 70, hy - 90), (cx + 40, hy - 110), (cx - 40, hy - 110)], fill=hair)
    elif spec["hair_style"] == "braid":
        d.polygon([(cx - 68, hy - 96), (cx - 10, hy - 36), (cx + 50, hy - 100)], fill=hair)
    elif spec["hair_style"] == "waves":
        d.polygon([(cx - 72, hy - 100), (cx - 20, hy - 28), (cx + 10, hy - 70), (cx + 40, hy - 24), (cx + 74, hy - 96)], fill=hair)
    elif spec["hair_style"] == "sleek":
        d.polygon([(cx - 70, hy - 100), (cx - 6, hy - 48), (cx + 8, hy - 8), (cx + 4, hy - 70), (cx + 72, hy - 104)], fill=hair)
    elif spec["hair_style"] == "loose":
        d.polygon([(cx - 74, hy - 98), (cx - 16, hy - 30), (cx + 12, hy - 60), (cx + 30, hy - 18), (cx + 76, hy - 90)], fill=hair)
    ears(d, cx, hy, skin, shade)
    if spec.get("circlet"):
        d.arc((cx - 78, hy - 78, cx + 78, hy + 10), 200, 340, fill=trim, width=4)
        d.polygon([(cx - 6, hy - 62), (cx, hy - 78), (cx + 6, hy - 62), (cx, hy - 54)], fill=trim)
    if spec.get("sash"):
        d.polygon([(cx + 10, 470), (cx + 36, 470), (cx + 48, 900), (cx + 16, 910)], fill=spec["sash"])
    if spec.get("beads"):
        y = 470
        for i in range(6):
            d.ellipse((cx - 7, y, cx + 7, y + 14), fill=spec["beads"])
            y += 22
    if spec.get("book"):
        d.rounded_rectangle((cx + 78, 640, cx + 154, 760), radius=4, fill=(36, 28, 22, 255))
        d.rectangle((cx + 86, 652, cx + 146, 748), fill=(232, 220, 196, 255))
        d.rectangle((cx + 112, 652, cx + 118, 748), fill=trim)
    if spec.get("mail"):
        for i in range(5):
            for j in range(3):
                d.arc((cx - 28 + j * 16, 450 + i * 14, cx - 12 + j * 16, 464 + i * 14), 0, 180, fill=trim, width=2)
    # crescent embroidery
    if spec.get("crescents"):
        for i, y in enumerate((560, 680, 800)):
            x = cx + (12 if i % 2 else -12)
            d.arc((x - 16, y, x + 16, y + 28), 300, 120, fill=trim, width=3)
    if spec.get("leaves"):
        for i, y in enumerate((540, 640, 740)):
            x = cx - 36 + (i % 2) * 70
            d.polygon([(x, y), (x + 16, y + 8), (x, y + 18), (x - 16, y + 8)], fill=trim)
    light = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(light)
    ld.ellipse((cx - 40, hy - 70, cx + 10, hy + 20), fill=(255, 255, 255, 28))
    ld.polygon([(cx - 40, 480), (cx + 20, 460), (cx + 8, 900), (cx - 55, 880)], fill=(255, 255, 255, 18))
    light = light.filter(ImageFilter.GaussianBlur(6))
    im = Image.alpha_composite(im, features)
    im = Image.alpha_composite(im, light)
    # ground contact so the cutout sits
    gd = ImageDraw.Draw(im)
    gd.ellipse((cx - 70, 990, cx + 70, 1030), fill=(0, 0, 0, 0))
    return im


ELVES = [
    {
        "id": "vaelith",
        "skin": (236, 214, 204, 255),
        "shade": (176, 132, 124),
        "hair": (214, 220, 228, 255),
        "hair_style": "sheet",
        "gown": (22, 24, 30, 255),
        "trim": (214, 220, 230, 255),
        "iris": (108, 78, 158, 255),
        "lip": (168, 96, 108, 255),
        "liner": (48, 36, 58, 255),
        "brow": (186, 192, 202, 255),
        "circlet": True,
        "crescents": True,
        "flare": 150,
    },
    {
        "id": "seryne",
        "skin": (196, 150, 112, 255),
        "shade": (122, 78, 54),
        "hair": (24, 20, 22, 255),
        "hair_style": "waves",
        "style": "coat",
        "gown": (42, 46, 54, 255),
        "trim": (198, 206, 214, 255),
        "cloak": (74, 36, 58, 255),
        "leg": (28, 26, 30, 255),
        "boot": (18, 16, 18, 255),
        "iris": (122, 136, 148, 255),
        "lip": (150, 78, 78, 255),
        "liner": (32, 24, 28, 255),
        "brow": (28, 22, 24, 255),
        "mail": True,
        "lift": 2,
    },
    {
        "id": "ilyra",
        "skin": (240, 214, 196, 255),
        "shade": (186, 140, 112),
        "hair": (196, 154, 78, 255),
        "hair_style": "braid",
        "gown": (28, 58, 42, 255),
        "trim": (196, 154, 74, 255),
        "iris": (58, 110, 72, 255),
        "lip": (176, 96, 96, 255),
        "liner": (36, 48, 36, 255),
        "brow": (150, 112, 58, 255),
        "circlet": True,
        "leaves": True,
        "flare": 188,
    },
    {
        "id": "nimrael",
        "skin": (228, 210, 206, 255),
        "shade": (150, 110, 118),
        "hair": (236, 234, 230, 255),
        "hair_style": "sleek",
        "gown": (32, 30, 36, 255),
        "trim": (90, 86, 98, 255),
        "iris": (42, 36, 48, 255),
        "lip": (120, 54, 68, 255),
        "liner": (28, 20, 28, 255),
        "brow": (40, 36, 40, 255),
        "sash": (92, 40, 64, 255),
        "beads": (18, 16, 20, 255),
        "flare": 132,
    },
    {
        "id": "orinel",
        "skin": (232, 196, 170, 255),
        "shade": (168, 102, 72),
        "hair": (166, 78, 42, 255),
        "hair_style": "loose",
        "gown": (36, 42, 84, 255),
        "trim": (198, 138, 58, 255),
        "iris": (196, 122, 42, 255),
        "lip": (170, 84, 78, 255),
        "liner": (62, 36, 28, 255),
        "brow": (120, 58, 32, 255),
        "freckles": True,
        "book": True,
        "flare": 160,
        "boot": (42, 32, 24, 255),
    },
]


def crop(im: Image.Image) -> Image.Image:
    box = im.getbbox()
    if not box:
        return im
    left, top, right, bottom = box
    pad = 12
    return im.crop((max(0, left - pad), max(0, top - pad), min(im.width, right + pad), min(im.height, bottom + pad)))


def main():
    out = "/workspace/public/elves"
    import os

    os.makedirs(out, exist_ok=True)
    for spec in ELVES:
        crop(paint(spec)).save(f"{out}/{spec['id']}.png")
        print(spec["id"])


if __name__ == "__main__":
    main()
