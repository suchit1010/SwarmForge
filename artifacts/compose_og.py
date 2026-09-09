#!/usr/bin/env python3
"""Compose Gauntlet OG share card at 2x, downsample to 1200x630."""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 2400, 1260  # 2x of 1200x630
BG = (11, 12, 11, 255)          # #0B0C0B
SURFACE = (20, 22, 20, 255)     # #141614
PAPER = (232, 230, 223, 255)    # #E8E6DF
MUTED = (155, 154, 146, 255)    # #9B9A92
STEEL = (215, 221, 214, 255)    # #D7DDD6

SANS_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SERIF_IT = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)


def radial_background(w, h):
    img = Image.new("RGB", (w, h), BG[:3])
    px = img.load()
    cx, cy = w / 2, h / 2
    max_r = math.hypot(cx, cy)
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy) / max_r
            # soft center lift toward elevated surface, vignette at edges
            t = min(1.0, d * 1.15)
            # ease
            t = t * t * (3 - 2 * t)
            col = lerp(SURFACE[:3], BG[:3], t)
            px[x, y] = col[:3]
    return img.convert("RGBA")


def draw_hairline_frame(draw, w, h):
    inset = 48
    color = (215, 221, 214, 38)
    draw.rectangle([inset, inset, w - inset - 1, h - inset - 1], outline=color, width=2)


def bezier_quad(p0, p1, p2, steps=48):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
        y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
        pts.append((x, y))
    return pts


def draw_three_node_loop(base, cx, cy, r, stroke=5, node_r=14, alpha=220, broken=True):
    """Equilateral three-node loop with outward-bulging arcs. Optional gap."""
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    angles = [-90.0, 30.0, 150.0]  # top, bottom-right, bottom-left
    pts = [
        (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
        for a in angles
    ]
    steel = (STEEL[0], STEEL[1], STEEL[2], alpha)
    paper = (PAPER[0], PAPER[1], PAPER[2], min(255, alpha + 20))

    for i in range(3):
        if broken and i == 0:
            # leave a gap on the top-right arc (node 0 -> node 1)
            p0, p2 = pts[i], pts[(i + 1) % 3]
            mx, my = (p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2
            vx, vy = mx - cx, my - cy
            mag = math.hypot(vx, vy) or 1
            bulge = 0.22 * r
            ctrl = (mx + vx / mag * bulge, my + vy / mag * bulge)
            full = bezier_quad(p0, ctrl, p2, steps=56)
            # draw only the first ~62% so the ring reads as broken
            cut = int(len(full) * 0.62)
            d.line(full[:cut], fill=steel, width=stroke, joint="curve")
            continue
        p0, p2 = pts[i], pts[(i + 1) % 3]
        mx, my = (p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2
        vx, vy = mx - cx, my - cy
        mag = math.hypot(vx, vy) or 1
        bulge = 0.22 * r
        ctrl = (mx + vx / mag * bulge, my + vy / mag * bulge)
        curve = bezier_quad(p0, ctrl, p2, steps=48)
        d.line(curve, fill=steel, width=stroke, joint="curve")

    for p in pts:
        # hollow node: outer ring + inner fill
        d.ellipse(
            [p[0] - node_r, p[1] - node_r, p[0] + node_r, p[1] + node_r],
            outline=steel,
            width=stroke,
        )
        inner = node_r * 0.38
        d.ellipse(
            [p[0] - inner, p[1] - inner, p[0] + inner, p[1] + inner],
            fill=paper,
        )
    base.alpha_composite(layer)


def draw_papers(base):
    """Quiet still-life: a few faint paper sheets at the lower corners."""
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sheets = [
        # lower left
        [(80, 980), (420, 940), (460, 1220), (90, 1240)],
        [(140, 1020), (500, 1000), (520, 1260), (150, 1260)],
        # lower right
        [(1980, 1000), (2320, 960), (2340, 1260), (1960, 1260)],
        [(1880, 1060), (2260, 1040), (2280, 1260), (1860, 1260)],
    ]
    fills = [
        (232, 230, 223, 18),
        (215, 221, 214, 14),
        (232, 230, 223, 16),
        (215, 221, 214, 12),
    ]
    for poly, fill in zip(sheets, fills):
        d.polygon(poly, fill=fill, outline=(215, 221, 214, 28))
    base.alpha_composite(layer)


def draw_tracked_text(draw, text, font, fill, cx, cy, tracking):
    """Draw text with letter-spacing, centered at (cx, cy) by visual bbox."""
    glyphs = []
    total = 0
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        gw = bbox[2] - bbox[0]
        glyphs.append((ch, gw, bbox))
        total += gw
        if i < len(text) - 1:
            total += tracking
    x = cx - total / 2
    # vertical center using a representative glyph
    sample = font.getbbox("H")
    gh = sample[3] - sample[1]
    y = cy - (sample[1] + sample[3]) / 2
    for i, (ch, gw, bbox) in enumerate(glyphs):
        draw.text((x - bbox[0], y), ch, font=font, fill=fill)
        x += gw
        if i < len(text) - 1:
            x += tracking
    return total, gh


def main():
    img = radial_background(W, H)
    draw = ImageDraw.Draw(img, "RGBA")
    draw_hairline_frame(draw, W, H)
    draw_papers(img)

    # Large faint loop as atmosphere, behind the lockup
    draw_three_node_loop(
        img, W / 2, H / 2 + 20, r=430, stroke=3, node_r=10, alpha=38, broken=True
    )

    # Lockup geometry — title sits in the middle half of the frame
    title_cy = H / 2 - 10
    mark_cy = title_cy - 230
    tag_cy = title_cy + 168

    # Primary mark: compact three-node loop above the title
    draw_three_node_loop(
        img, W / 2, mark_cy, r=78, stroke=6, node_r=13, alpha=230, broken=True
    )

    title_font = ImageFont.truetype(SANS_BOLD, 214)
    tag_font = ImageFont.truetype(SERIF_IT, 44)

    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    # Measure tracked title to keep it in the 50–66% width band
    tracking = 28
    tw, th = draw_tracked_text(
        od, "GAUNTLET", title_font, PAPER, W / 2, title_cy, tracking
    )
    # If too narrow/wide, the 168px + 18 tracking should land ~60% of 2400
    print(f"title width={tw:.0f}px ({tw / W * 100:.1f}% of frame) height={th:.0f}")

    # Hairline rule under the title
    rule_y = title_cy + 108
    rule_w = min(tw * 0.38, 480)
    od.line(
        [(W / 2 - rule_w / 2, rule_y), (W / 2 + rule_w / 2, rule_y)],
        fill=(215, 221, 214, 160),
        width=2,
    )

    tag = "Drop the mess. Walk away."
    tb = tag_font.getbbox(tag)
    tw2 = tb[2] - tb[0]
    od.text(
        (W / 2 - tw2 / 2, tag_cy - (tb[1] + tb[3]) / 2),
        tag,
        font=tag_font,
        fill=MUTED,
    )

    img.alpha_composite(overlay)

    # Downsample 2x → 1200×630
    out = img.convert("RGB").resize((1200, 630), Image.Resampling.LANCZOS)
    out.save("artifacts/card-raw.png", "PNG")
    print("wrote artifacts/card-raw.png", out.size)


if __name__ == "__main__":
    main()
