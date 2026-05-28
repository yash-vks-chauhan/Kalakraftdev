#!/usr/bin/env python3
"""
Render a UML use case diagram and a Chen-style ER diagram for the Artcommerce project.

Notation references used while designing these outputs:
- OMG UML 2.5.1: https://www.omg.org/spec/UML
- UML use case reference: https://www.uml-diagrams.org/use-case-reference.html
- Chen ER notation summary: https://courses.cs.umbc.edu/461/current/burt/lectures/lec03/erd.shtml
"""

from __future__ import annotations

from math import atan2, cos, pi, sin
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "diagrams"
OUT_DIR.mkdir(parents=True, exist_ok=True)


PALETTE = {
    "bg": "#fffdf8",
    "ink": "#1f1f1f",
    "muted": "#666666",
    "commerce": "#f4f7ff",
    "support": "#fff4f4",
    "ops": "#f4fff7",
    "legend": "#fafafa",
    "accent": "#2f5bea",
    "green": "#1b8f4f",
    "purple": "#7441c8",
    "red": "#b23a48",
    "gold": "#9b6d07",
}


FONT_REGULAR = "/System/Library/Fonts/Supplemental/Verdana.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Verdana Bold.ttf"
FONT_ITALIC = "/System/Library/Fonts/Supplemental/Verdana Italic.ttf"


def load_font(size: int, kind: str = "regular") -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = {
        "regular": FONT_REGULAR,
        "bold": FONT_BOLD,
        "italic": FONT_ITALIC,
    }.get(kind, FONT_REGULAR)
    try:
        return ImageFont.truetype(path, size=size)
    except OSError:
        return ImageFont.load_default()


TITLE_FONT = load_font(36, "bold")
SUBTITLE_FONT = load_font(18, "regular")
LABEL_FONT = load_font(18, "bold")
TEXT_FONT = load_font(16, "regular")
SMALL_FONT = load_font(14, "regular")
ITALIC_FONT = load_font(16, "italic")


def rect(x: int, y: int, w: int, h: int) -> dict[str, int]:
    return {"x": x, "y": y, "w": w, "h": h}


def bounds(node: dict[str, int]) -> tuple[int, int, int, int]:
    return (node["x"], node["y"], node["x"] + node["w"], node["y"] + node["h"])


def center(node: dict[str, int]) -> tuple[float, float]:
    return (node["x"] + node["w"] / 2, node["y"] + node["h"] / 2)


def left(node: dict[str, int]) -> tuple[float, float]:
    return (node["x"], node["y"] + node["h"] / 2)


def right(node: dict[str, int]) -> tuple[float, float]:
    return (node["x"] + node["w"], node["y"] + node["h"] / 2)


def top(node: dict[str, int]) -> tuple[float, float]:
    return (node["x"] + node["w"] / 2, node["y"])


def bottom(node: dict[str, int]) -> tuple[float, float]:
    return (node["x"] + node["w"] / 2, node["y"] + node["h"])


def multiline_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> tuple[int, int]:
    bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=4, align="center")
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    node: dict[str, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: str = PALETTE["ink"],
    underline: bool = False,
) -> None:
    tw, th = multiline_size(draw, text, font)
    tx = node["x"] + (node["w"] - tw) / 2
    ty = node["y"] + (node["h"] - th) / 2
    draw.multiline_text((tx, ty), text, font=font, fill=fill, spacing=4, align="center")
    if underline:
        for line in text.splitlines():
            line_bbox = draw.textbbox((0, 0), line, font=font)
            lw = line_bbox[2] - line_bbox[0]
            lh = line_bbox[3] - line_bbox[1]
            lx = node["x"] + (node["w"] - lw) / 2
            ly = ty + lh + 1
            draw.line((lx, ly, lx + lw, ly), fill=fill, width=2)
            ty += lh + 4


def draw_title(
    draw: ImageDraw.ImageDraw,
    title: str,
    subtitle: str,
    width: int,
) -> None:
    draw.text((50, 28), title, font=TITLE_FONT, fill=PALETTE["ink"])
    draw.text((52, 76), subtitle, font=SUBTITLE_FONT, fill=PALETTE["muted"])
    draw.line((50, 112, width - 50, 112), fill="#ddd8cd", width=2)


def draw_actor(draw: ImageDraw.ImageDraw, x: int, y: int, label: str) -> None:
    head_r = 18
    cx = x
    draw.ellipse((cx - head_r, y, cx + head_r, y + 2 * head_r), outline=PALETTE["ink"], width=3)
    draw.line((cx, y + 2 * head_r, cx, y + 94), fill=PALETTE["ink"], width=3)
    draw.line((cx - 34, y + 52, cx + 34, y + 52), fill=PALETTE["ink"], width=3)
    draw.line((cx, y + 94, cx - 28, y + 132), fill=PALETTE["ink"], width=3)
    draw.line((cx, y + 94, cx + 28, y + 132), fill=PALETTE["ink"], width=3)
    label_box = rect(x - 90, y + 138, 180, 48)
    draw_centered_text(draw, label_box, label, TEXT_FONT)


def draw_rectangle_node(
    draw: ImageDraw.ImageDraw,
    node: dict[str, int],
    text: str,
    *,
    fill: str = "white",
    outline: str = PALETTE["ink"],
    width: int = 3,
    double: bool = False,
    font: ImageFont.ImageFont = LABEL_FONT,
) -> None:
    draw.rectangle(bounds(node), fill=fill, outline=outline, width=width)
    if double:
        inset = 6
        inner = rect(node["x"] + inset, node["y"] + inset, node["w"] - 2 * inset, node["h"] - 2 * inset)
        draw.rectangle(bounds(inner), outline=outline, width=2)
    draw_centered_text(draw, node, text, font)


def draw_ellipse_outline(
    draw: ImageDraw.ImageDraw,
    bbox: tuple[int, int, int, int],
    *,
    outline: str,
    width: int = 3,
    dashed: bool = False,
) -> None:
    if not dashed:
        draw.ellipse(bbox, outline=outline, width=width)
        return
    for start in range(0, 360, 18):
        draw.arc(bbox, start, start + 10, fill=outline, width=width)


def draw_ellipse_node(
    draw: ImageDraw.ImageDraw,
    node: dict[str, int],
    text: str,
    *,
    fill: str = "white",
    outline: str = PALETTE["ink"],
    width: int = 3,
    double: bool = False,
    dashed: bool = False,
    font: ImageFont.ImageFont = LABEL_FONT,
    underline: bool = False,
) -> None:
    draw.ellipse(bounds(node), fill=fill, outline=None)
    draw_ellipse_outline(draw, bounds(node), outline=outline, width=width, dashed=dashed)
    if double:
        inset = 6
        inner = rect(node["x"] + inset, node["y"] + inset, node["w"] - 2 * inset, node["h"] - 2 * inset)
        draw_ellipse_outline(draw, bounds(inner), outline=outline, width=2, dashed=dashed)
    draw_centered_text(draw, node, text, font, underline=underline)


def diamond_points(node: dict[str, int]) -> list[tuple[float, float]]:
    cx, cy = center(node)
    return [
        (cx, node["y"]),
        (node["x"] + node["w"], cy),
        (cx, node["y"] + node["h"]),
        (node["x"], cy),
    ]


def draw_diamond_node(
    draw: ImageDraw.ImageDraw,
    node: dict[str, int],
    text: str,
    *,
    fill: str = "white",
    outline: str = PALETTE["ink"],
    width: int = 3,
    double: bool = False,
    font: ImageFont.ImageFont = TEXT_FONT,
) -> None:
    draw.polygon(diamond_points(node), fill=fill, outline=outline, width=width)
    if double:
        inset = 7
        inner = rect(node["x"] + inset, node["y"] + inset, node["w"] - 2 * inset, node["h"] - 2 * inset)
        draw.polygon(diamond_points(inner), outline=outline, width=2)
    draw_centered_text(draw, node, text, font)


def draw_polyline(
    draw: ImageDraw.ImageDraw,
    points: Iterable[tuple[float, float]],
    *,
    fill: str = PALETTE["ink"],
    width: int = 3,
    dashed: bool = False,
) -> None:
    pts = list(points)
    if len(pts) < 2:
        return
    if not dashed:
        draw.line(pts, fill=fill, width=width)
        return
    dash_len = 12
    gap = 8
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        dx = x2 - x1
        dy = y2 - y1
        length = (dx * dx + dy * dy) ** 0.5
        if length == 0:
            continue
        ux = dx / length
        uy = dy / length
        step = dash_len + gap
        pos = 0.0
        while pos < length:
            end = min(pos + dash_len, length)
            draw.line(
                (
                    x1 + ux * pos,
                    y1 + uy * pos,
                    x1 + ux * end,
                    y1 + uy * end,
                ),
                fill=fill,
                width=width,
            )
            pos += step


def draw_open_arrowhead(draw: ImageDraw.ImageDraw, p_from: tuple[float, float], p_to: tuple[float, float], fill: str) -> None:
    angle = atan2(p_to[1] - p_from[1], p_to[0] - p_from[0])
    length = 18
    spread = pi / 7
    p1 = (p_to[0] - length * cos(angle - spread), p_to[1] - length * sin(angle - spread))
    p2 = (p_to[0] - length * cos(angle + spread), p_to[1] - length * sin(angle + spread))
    draw.line((p_to, p1), fill=fill, width=3)
    draw.line((p_to, p2), fill=fill, width=3)


def draw_hollow_triangle(draw: ImageDraw.ImageDraw, p_from: tuple[float, float], p_to: tuple[float, float], fill: str) -> None:
    angle = atan2(p_to[1] - p_from[1], p_to[0] - p_from[0])
    length = 22
    spread = pi / 8
    p1 = (p_to[0] - length * cos(angle - spread), p_to[1] - length * sin(angle - spread))
    p2 = (p_to[0] - length * cos(angle + spread), p_to[1] - length * sin(angle + spread))
    draw.polygon([p_to, p1, p2], outline=fill, fill="white", width=3)


def draw_labeled_relation(
    draw: ImageDraw.ImageDraw,
    start: tuple[float, float],
    end: tuple[float, float],
    *,
    label: str | None = None,
    dashed: bool = False,
    generalization: bool = False,
    fill: str = PALETTE["ink"],
) -> None:
    draw_polyline(draw, [start, end], fill=fill, dashed=dashed)
    if generalization:
        draw_hollow_triangle(draw, start, end, fill)
    else:
        draw_open_arrowhead(draw, start, end, fill)
    if label:
        mx = (start[0] + end[0]) / 2
        my = (start[1] + end[1]) / 2 - 16
        box = rect(int(mx - 80), int(my - 14), 160, 28)
        draw.rectangle(bounds(box), fill=PALETTE["bg"])
        draw_centered_text(draw, box, label, SMALL_FONT, fill=fill)


def draw_association(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float], *, fill: str = PALETTE["ink"]) -> None:
    draw_polyline(draw, [start, end], fill=fill, dashed=False)


def draw_cardinality(draw: ImageDraw.ImageDraw, point: tuple[float, float], text: str, dx: int, dy: int) -> None:
    box = rect(int(point[0] + dx - 22), int(point[1] + dy - 12), 44, 24)
    draw.rectangle(bounds(box), fill=PALETTE["bg"])
    draw_centered_text(draw, box, text, SMALL_FONT)


def draw_double_connector(
    draw: ImageDraw.ImageDraw,
    start: tuple[float, float],
    end: tuple[float, float],
    *,
    fill: str = PALETTE["ink"],
) -> None:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if abs(dx) >= abs(dy):
        offset = 4
        draw.line((start[0], start[1] - offset, end[0], end[1] - offset), fill=fill, width=3)
        draw.line((start[0], start[1] + offset, end[0], end[1] + offset), fill=fill, width=3)
    else:
        offset = 4
        draw.line((start[0] - offset, start[1], end[0] - offset, end[1]), fill=fill, width=3)
        draw.line((start[0] + offset, start[1], end[0] + offset, end[1]), fill=fill, width=3)


def use_case_diagram() -> None:
    width, height = 3000, 1900
    image = Image.new("RGB", (width, height), PALETTE["bg"])
    draw = ImageDraw.Draw(image)

    draw_title(
        draw,
        "Artcommerce Use Case Diagram",
        "UML use case notation with actors, subject boundary, associations, include, extend, and generalization.",
        width,
    )

    boundary = rect(360, 150, 2140, 1660)
    draw.rectangle(bounds(boundary), outline=PALETTE["ink"], width=4)
    draw.text((384, 168), "Artcommerce Platform", font=LABEL_FONT, fill=PALETTE["ink"])
    draw.text((384, 194), "<<Service>>", font=ITALIC_FONT, fill=PALETTE["muted"])

    # Actors
    draw_actor(draw, 130, 260, "Visitor")
    draw_actor(draw, 130, 720, "Authenticated\nUser")
    draw_actor(draw, 130, 1000, "Customer")
    draw_actor(draw, 130, 1280, "Admin")

    draw_actor(draw, 2850, 310, "Firebase\nAuth")
    draw_actor(draw, 2850, 800, "Notification &\nRealtime Services")
    draw_actor(draw, 2850, 1180, "Media\nStorage")

    # Use cases
    nodes = {
        "browse": rect(560, 230, 250, 92),
        "view": rect(900, 230, 300, 92),
        "signup": rect(1290, 230, 220, 92),
        "auth": rect(780, 430, 300, 92),
        "pwd": rect(1140, 430, 280, 92),
        "fed": rect(1490, 430, 300, 92),
        "cart": rect(540, 760, 230, 92),
        "wishlist": rect(860, 760, 260, 92),
        "addresses": rect(1220, 760, 280, 92),
        "checkout": rect(1650, 760, 250, 92),
        "coupon": rect(1730, 610, 210, 80),
        "track": rect(540, 1040, 240, 92),
        "review": rect(860, 1040, 230, 92),
        "create_ticket": rect(1190, 1040, 330, 92),
        "reply_ticket": rect(1620, 1040, 330, 92),
        "upload_attachment": rect(1360, 1250, 310, 92),
        "manage_products": rect(510, 1380, 290, 92),
        "upload_media": rect(860, 1380, 240, 92),
        "manage_coupons": rect(1200, 1380, 280, 92),
        "manage_orders": rect(1570, 1380, 260, 92),
        "update_status": rect(870, 1620, 290, 92),
        "export_orders": rect(1220, 1620, 260, 92),
        "send_reminder": rect(510, 1620, 290, 92),
        "manage_support": rect(1570, 1620, 330, 92),
        "moderate_reviews": rect(1960, 1380, 300, 92),
    }

    for key, node in nodes.items():
        fill = PALETTE["commerce"]
        if "ticket" in key or "support" in key or "attachment" in key:
            fill = PALETTE["support"]
        elif key in {"manage_products", "upload_media", "manage_coupons", "manage_orders", "update_status", "export_orders", "send_reminder", "moderate_reviews"}:
            fill = PALETTE["ops"]
        label = {
            "browse": "Browse Products",
            "view": "View Product\nDetails",
            "signup": "Sign Up",
            "auth": "Authenticate\nUser",
            "pwd": "Login with\nPassword",
            "fed": "Login with\nFirebase",
            "cart": "Manage Cart",
            "wishlist": "Manage\nWishlist",
            "addresses": "Manage\nAddresses",
            "checkout": "Checkout",
            "coupon": "Apply Coupon",
            "track": "Track Orders",
            "review": "Submit Review",
            "create_ticket": "Create Support\nTicket",
            "reply_ticket": "Reply to Support\nTicket",
            "upload_attachment": "Upload\nAttachment",
            "manage_products": "Manage Products",
            "upload_media": "Upload Media",
            "manage_coupons": "Manage Coupons",
            "manage_orders": "Manage Orders",
            "update_status": "Update Order\nStatus",
            "export_orders": "Export Orders",
            "send_reminder": "Send Cart\nReminder",
            "manage_support": "Manage Support\nTickets",
            "moderate_reviews": "Moderate Reviews",
        }[key]
        font = ITALIC_FONT if key == "auth" else LABEL_FONT
        draw_ellipse_node(draw, node, label, fill=fill, font=font)

    # Associations from actors
    draw_association(draw, (165, 330), left(nodes["browse"]))
    draw_association(draw, (165, 330), left(nodes["view"]))
    draw_association(draw, (165, 330), left(nodes["signup"]))

    draw_association(draw, (165, 790), left(nodes["cart"]))
    draw_association(draw, (165, 790), left(nodes["wishlist"]))
    draw_association(draw, (165, 790), left(nodes["addresses"]))
    draw_association(draw, (165, 790), left(nodes["track"]))

    draw_association(draw, (165, 1070), left(nodes["checkout"]))
    draw_association(draw, (165, 1070), left(nodes["review"]))
    draw_association(draw, (165, 1070), left(nodes["create_ticket"]))
    draw_association(draw, (165, 1070), left(nodes["reply_ticket"]))

    draw_association(draw, (165, 1350), left(nodes["manage_products"]))
    draw_association(draw, (165, 1350), left(nodes["manage_coupons"]))
    draw_association(draw, (165, 1350), left(nodes["manage_orders"]))
    draw_association(draw, (165, 1350), left(nodes["manage_support"]))
    draw_association(draw, (165, 1350), left(nodes["moderate_reviews"]))
    draw_association(draw, (165, 1350), left(nodes["send_reminder"]))

    draw_association(draw, (2815, 380), right(nodes["fed"]))

    draw_association(draw, (2815, 870), right(nodes["checkout"]))
    draw_association(draw, (2815, 870), right(nodes["update_status"]))
    draw_association(draw, (2815, 870), right(nodes["create_ticket"]))
    draw_association(draw, (2815, 870), right(nodes["reply_ticket"]))
    draw_association(draw, (2815, 870), right(nodes["send_reminder"]))

    draw_association(draw, (2815, 1250), right(nodes["upload_media"]))
    draw_association(draw, (2815, 1250), right(nodes["upload_attachment"]))

    # Generalization between actors
    draw_polyline(draw, [(130, 1140), (130, 920)], fill=PALETTE["muted"])
    draw_hollow_triangle(draw, (130, 1140), (130, 920), PALETTE["muted"])
    draw_polyline(draw, [(130, 1420), (130, 920)], fill=PALETTE["muted"])
    draw_hollow_triangle(draw, (130, 1420), (130, 920), PALETTE["muted"])

    # Use case generalization
    draw_polyline(draw, [top(nodes["pwd"]), (930, 522)], fill=PALETTE["purple"])
    draw_hollow_triangle(draw, top(nodes["pwd"]), bottom(nodes["auth"]), PALETTE["purple"])
    draw_polyline(draw, [top(nodes["fed"]), (930, 522)], fill=PALETTE["purple"])
    draw_hollow_triangle(draw, top(nodes["fed"]), bottom(nodes["auth"]), PALETTE["purple"])

    # include / extend
    draw_labeled_relation(draw, bottom(nodes["create_ticket"]), top(nodes["upload_attachment"]), label="<<include>>", dashed=True, fill=PALETTE["accent"])
    draw_labeled_relation(draw, bottom(nodes["reply_ticket"]), top(nodes["upload_attachment"]), label="<<include>>", dashed=True, fill=PALETTE["accent"])
    draw_labeled_relation(draw, left(nodes["manage_orders"]), right(nodes["update_status"]), label="<<include>>", dashed=True, fill=PALETTE["accent"])
    draw_labeled_relation(draw, bottom(nodes["manage_orders"]), top(nodes["export_orders"]), label="<<include>>", dashed=True, fill=PALETTE["accent"])
    draw_labeled_relation(draw, top(nodes["coupon"]), bottom(nodes["checkout"]), label="<<extend>>", dashed=True, fill=PALETTE["red"])

    # Legend
    legend = rect(2320, 1320, 540, 420)
    draw.rounded_rectangle(bounds(legend), radius=18, fill=PALETTE["legend"], outline="#d7d2c8", width=2)
    draw.text((2350, 1350), "Legend", font=LABEL_FONT, fill=PALETTE["ink"])
    draw_actor(draw, 2388, 1396, "")
    draw.text((2440, 1432), "Actor", font=TEXT_FONT, fill=PALETTE["ink"])
    sample_use_case = rect(2345, 1478, 180, 70)
    draw_ellipse_node(draw, sample_use_case, "Use Case", fill=PALETTE["commerce"], font=TEXT_FONT)
    draw.text((2550, 1503), "Use case ellipse", font=TEXT_FONT, fill=PALETTE["ink"])
    draw.rectangle((2345, 1574, 2525, 1636), outline=PALETTE["ink"], width=3)
    draw.text((2550, 1592), "System boundary", font=TEXT_FONT, fill=PALETTE["ink"])
    draw_association(draw, (2350, 1684), (2520, 1684))
    draw.text((2550, 1673), "Association", font=TEXT_FONT, fill=PALETTE["ink"])
    draw_labeled_relation(draw, (2350, 1732), (2520, 1732), label="<<include>>", dashed=True, fill=PALETTE["accent"])
    draw_labeled_relation(draw, (2350, 1788), (2520, 1788), label="<<extend>>", dashed=True, fill=PALETTE["red"])
    draw_polyline(draw, [(2350, 1840), (2520, 1840)], fill=PALETTE["purple"])
    draw_hollow_triangle(draw, (2350, 1840), (2520, 1840), PALETTE["purple"])
    draw.text((2550, 1828), "Generalization", font=TEXT_FONT, fill=PALETTE["ink"])

    image.save(OUT_DIR / "use-case-diagram.png")


def er_diagram() -> None:
    width, height = 3600, 2400
    image = Image.new("RGB", (width, height), PALETTE["bg"])
    draw = ImageDraw.Draw(image)

    draw_title(
        draw,
        "Artcommerce ER Diagram (Chen Notation)",
        "Conceptual entity-relationship model with entity rectangles, relationship diamonds, attribute ovals, weak entity, multivalued attributes, derived attributes, keys, and participation.",
        width,
    )

    # Entities
    user = rect(220, 220, 240, 110)
    address = rect(220, 760, 240, 110)
    order = rect(880, 1120, 240, 110)
    product = rect(1510, 220, 250, 110)
    category = rect(1510, 760, 250, 110)
    coupon = rect(1510, 1120, 250, 110)
    ticket = rect(2460, 1020, 270, 110)
    message = rect(2970, 1420, 260, 120)

    draw_rectangle_node(draw, user, "User", fill=PALETTE["commerce"])
    draw_rectangle_node(draw, address, "Address", fill=PALETTE["commerce"])
    draw_rectangle_node(draw, order, "Order", fill=PALETTE["ops"])
    draw_rectangle_node(draw, product, "Product", fill=PALETTE["commerce"])
    draw_rectangle_node(draw, category, "Category", fill=PALETTE["commerce"])
    draw_rectangle_node(draw, coupon, "Coupon", fill=PALETTE["ops"])
    draw_rectangle_node(draw, ticket, "SupportTicket", fill=PALETTE["support"])
    draw_rectangle_node(draw, message, "SupportMessage", fill=PALETTE["support"], double=True)

    # Relationships
    has_address = rect(520, 500, 190, 110)
    cart_rel = rect(820, 310, 200, 110)
    wishlist_rel = rect(840, 660, 210, 120)
    places_rel = rect(520, 1110, 170, 100)
    opens_rel = rect(700, 1470, 170, 100)
    reviews_rel = rect(1240, 1640, 190, 110)
    contains_rel = rect(1190, 850, 200, 110)
    belongs_rel = rect(1560, 500, 200, 110)
    applies_rel = rect(1270, 1110, 170, 100)
    has_message = rect(2770, 1400, 170, 100)

    draw_diamond_node(draw, has_address, "HAS\nADDRESS", fill="#fffdf4")
    draw_diamond_node(draw, cart_rel, "ADDS TO\nCART", fill="#fffdf4")
    draw_diamond_node(draw, wishlist_rel, "SAVES TO\nWISHLIST", fill="#fffdf4")
    draw_diamond_node(draw, places_rel, "PLACES", fill="#fffdf4")
    draw_diamond_node(draw, opens_rel, "OPENS", fill="#fffdf4")
    draw_diamond_node(draw, reviews_rel, "REVIEWS", fill="#fffdf4")
    draw_diamond_node(draw, contains_rel, "CONTAINS", fill="#fffdf4")
    draw_diamond_node(draw, belongs_rel, "BELONGS\nTO", fill="#fffdf4")
    draw_diamond_node(draw, applies_rel, "APPLIES", fill="#fffdf4")
    draw_diamond_node(draw, has_message, "HAS\nMESSAGE", fill="#fffdf4", double=True)

    # Attributes
    # User
    draw_ellipse_node(draw, rect(80, 90, 180, 68), "userId", fill="white", underline=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(60, 250, 150, 68), "email", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(300, 80, 170, 68), "fullName", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(330, 260, 120, 68), "role", fill="white", font=TEXT_FONT)

    # Address
    draw_ellipse_node(draw, rect(70, 640, 190, 68), "addressId", fill="white", underline=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(60, 820, 130, 68), "label", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(250, 640, 140, 68), "city", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(300, 820, 180, 68), "postalCode", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(240, 930, 150, 68), "country", fill="white", font=TEXT_FONT)

    # Order
    draw_ellipse_node(draw, rect(760, 990, 160, 68), "orderId", fill="white", underline=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(760, 1248, 190, 68), "orderNumber", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1020, 980, 140, 68), "status", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1010, 1248, 180, 68), "paymentMethod", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(830, 1350, 170, 68), "totalAmount", fill="white", font=TEXT_FONT)

    # Product
    draw_ellipse_node(draw, rect(1330, 90, 180, 68), "productId", fill="white", underline=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1330, 250, 140, 68), "name", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1775, 90, 130, 68), "price", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1760, 250, 170, 68), "stockQty", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1840, 380, 180, 72), "imageUrls", fill="white", double=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1600, 390, 180, 72), "usageTags", fill="white", double=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1330, 390, 180, 72), "avgRating", fill="white", dashed=True, font=TEXT_FONT)

    # Category
    draw_ellipse_node(draw, rect(1300, 640, 190, 68), "categoryId", fill="white", underline=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1760, 640, 140, 68), "name", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1760, 820, 130, 68), "slug", fill="white", font=TEXT_FONT)

    # Coupon
    draw_ellipse_node(draw, rect(1340, 1000, 140, 68), "code", fill="white", underline=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1780, 1000, 120, 68), "type", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1770, 1248, 130, 68), "amount", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(1330, 1248, 180, 68), "expiresAt", fill="white", font=TEXT_FONT)

    # Ticket
    draw_ellipse_node(draw, rect(2290, 890, 150, 68), "ticketId", fill="white", underline=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(2740, 890, 160, 68), "subject", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(2290, 1160, 140, 68), "status", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(2730, 1160, 180, 68), "createdAt", fill="white", font=TEXT_FONT)

    # Message
    draw_ellipse_node(draw, rect(3200, 1320, 150, 68), "msgSeq", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(3210, 1450, 160, 68), "sender", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(3210, 1580, 170, 68), "createdAt", fill="white", font=TEXT_FONT)
    draw_ellipse_node(draw, rect(2820, 1560, 180, 72), "attachments", fill="white", double=True, font=TEXT_FONT)
    draw_ellipse_node(draw, rect(2820, 1290, 170, 68), "content", fill="white", font=TEXT_FONT)

    # Relationship attributes
    draw_ellipse_node(draw, rect(900, 180, 140, 60), "quantity", fill="white", font=SMALL_FONT)
    draw_ellipse_node(draw, rect(910, 450, 130, 60), "addedAt", fill="white", font=SMALL_FONT)
    draw_ellipse_node(draw, rect(1240, 730, 140, 60), "quantity", fill="white", font=SMALL_FONT)
    draw_ellipse_node(draw, rect(1410, 850, 170, 60), "priceAtPurchase", fill="white", font=SMALL_FONT)
    draw_ellipse_node(draw, rect(1180, 1780, 120, 60), "rating", fill="white", font=SMALL_FONT)
    draw_ellipse_node(draw, rect(1370, 1780, 140, 60), "comment", fill="white", font=SMALL_FONT)

    # Connect attributes to entities / relationships
    for attr_node, entity_node in [
        (rect(80, 90, 180, 68), user),
        (rect(60, 250, 150, 68), user),
        (rect(300, 80, 170, 68), user),
        (rect(330, 260, 120, 68), user),
        (rect(70, 640, 190, 68), address),
        (rect(60, 820, 130, 68), address),
        (rect(250, 640, 140, 68), address),
        (rect(300, 820, 180, 68), address),
        (rect(240, 930, 150, 68), address),
        (rect(760, 990, 160, 68), order),
        (rect(760, 1248, 190, 68), order),
        (rect(1020, 980, 140, 68), order),
        (rect(1010, 1248, 180, 68), order),
        (rect(830, 1350, 170, 68), order),
        (rect(1330, 90, 180, 68), product),
        (rect(1330, 250, 140, 68), product),
        (rect(1775, 90, 130, 68), product),
        (rect(1760, 250, 170, 68), product),
        (rect(1840, 380, 180, 72), product),
        (rect(1600, 390, 180, 72), product),
        (rect(1330, 390, 180, 72), product),
        (rect(1300, 640, 190, 68), category),
        (rect(1760, 640, 140, 68), category),
        (rect(1760, 820, 130, 68), category),
        (rect(1340, 1000, 140, 68), coupon),
        (rect(1780, 1000, 120, 68), coupon),
        (rect(1770, 1248, 130, 68), coupon),
        (rect(1330, 1248, 180, 68), coupon),
        (rect(2290, 890, 150, 68), ticket),
        (rect(2740, 890, 160, 68), ticket),
        (rect(2290, 1160, 140, 68), ticket),
        (rect(2730, 1160, 180, 68), ticket),
        (rect(3200, 1320, 150, 68), message),
        (rect(3210, 1450, 160, 68), message),
        (rect(3210, 1580, 170, 68), message),
        (rect(2820, 1560, 180, 72), message),
        (rect(2820, 1290, 170, 68), message),
        (rect(900, 180, 140, 60), cart_rel),
        (rect(910, 450, 130, 60), wishlist_rel),
        (rect(1240, 730, 140, 60), contains_rel),
        (rect(1410, 850, 170, 60), contains_rel),
        (rect(1180, 1780, 120, 60), reviews_rel),
        (rect(1370, 1780, 140, 60), reviews_rel),
    ]:
        draw_association(draw, center(attr_node), center(entity_node), fill=PALETTE["muted"])

    # Connect relationships with cardinalities
    draw_association(draw, right(user), left(has_address))
    draw_association(draw, right(has_address), left(address))
    draw_cardinality(draw, right(user), "1", 22, -20)
    draw_cardinality(draw, left(address), "N", -18, -20)

    draw_association(draw, right(user), left(cart_rel))
    draw_association(draw, right(cart_rel), left(product))
    draw_cardinality(draw, right(user), "N", 22, 20)
    draw_cardinality(draw, left(product), "N", -20, 20)

    draw_association(draw, right(user), left(wishlist_rel))
    draw_association(draw, right(wishlist_rel), bottom(product))
    draw_cardinality(draw, right(user), "N", 22, 18)
    draw_cardinality(draw, bottom(product), "N", 20, 10)

    draw_association(draw, bottom(user), top(places_rel))
    draw_association(draw, right(places_rel), left(order))
    draw_cardinality(draw, bottom(user), "1", 10, 18)
    draw_cardinality(draw, left(order), "N", -18, -18)

    draw_association(draw, right(product), left(belongs_rel))
    draw_association(draw, bottom(belongs_rel), top(category))
    draw_cardinality(draw, right(product), "N", 24, -18)
    draw_cardinality(draw, top(category), "1", 12, -18)

    draw_double_connector(draw, top(order), left(contains_rel))
    draw_association(draw, top(product), right(contains_rel))
    draw_cardinality(draw, top(order), "1", 12, -18)
    draw_cardinality(draw, top(product), "N", 14, -18)

    draw_association(draw, right(order), left(applies_rel))
    draw_association(draw, right(applies_rel), left(coupon))
    draw_cardinality(draw, right(order), "0..1", 26, -18)
    draw_cardinality(draw, left(coupon), "N", -20, -18)

    draw_association(draw, bottom(user), left(opens_rel))
    draw_association(draw, right(opens_rel), left(ticket))
    draw_cardinality(draw, bottom(user), "1", 14, 20)
    draw_cardinality(draw, left(ticket), "N", -22, -18)

    draw_association(draw, bottom(user), left(reviews_rel))
    draw_association(draw, right(reviews_rel), bottom(product))
    draw_cardinality(draw, bottom(user), "N", 24, 20)
    draw_cardinality(draw, bottom(product), "N", 20, 14)

    draw_association(draw, right(ticket), left(has_message))
    draw_double_connector(draw, right(has_message), left(message))
    draw_cardinality(draw, right(ticket), "1", 16, -20)
    draw_cardinality(draw, left(message), "N", -18, -20)

    # Legend
    legend = rect(2830, 160, 670, 950)
    draw.rounded_rectangle(bounds(legend), radius=18, fill=PALETTE["legend"], outline="#d7d2c8", width=2)
    draw.text((2860, 190), "Chen Notation Legend", font=LABEL_FONT, fill=PALETTE["ink"])

    y = 250
    sample = rect(2870, y, 150, 62)
    draw_rectangle_node(draw, sample, "Entity", fill="white", font=TEXT_FONT)
    draw.text((3050, y + 18), "Rectangle = entity", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 90

    sample = rect(2870, y, 150, 62)
    draw_rectangle_node(draw, sample, "Weak", fill="white", font=TEXT_FONT, double=True)
    draw.text((3050, y + 18), "Double rectangle = weak entity", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 90

    sample = rect(2890, y, 120, 70)
    draw_diamond_node(draw, sample, "REL", fill="white", font=TEXT_FONT)
    draw.text((3050, y + 22), "Diamond = relationship", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 100

    sample = rect(2890, y, 120, 70)
    draw_diamond_node(draw, sample, "ID", fill="white", font=TEXT_FONT, double=True)
    draw.text((3050, y + 22), "Double diamond = identifying relationship", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 100

    sample = rect(2870, y, 150, 62)
    draw_ellipse_node(draw, sample, "attribute", fill="white", font=TEXT_FONT)
    draw.text((3050, y + 18), "Ellipse = attribute", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 90

    sample = rect(2870, y, 150, 62)
    draw_ellipse_node(draw, sample, "multi", fill="white", font=TEXT_FONT, double=True)
    draw.text((3050, y + 18), "Double ellipse = multivalued attribute", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 90

    sample = rect(2870, y, 150, 62)
    draw_ellipse_node(draw, sample, "derived", fill="white", font=TEXT_FONT, dashed=True)
    draw.text((3050, y + 18), "Dashed ellipse = derived attribute", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 90

    sample = rect(2870, y, 150, 62)
    draw_ellipse_node(draw, sample, "key", fill="white", font=TEXT_FONT, underline=True)
    draw.text((3050, y + 18), "Underlined attribute = key", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 90

    draw.line((2890, y + 30, 3010, y + 30), fill=PALETTE["ink"], width=3)
    draw.line((2890, y + 40, 3010, y + 40), fill=PALETTE["ink"], width=3)
    draw.text((3050, y + 18), "Double line = total participation", font=TEXT_FONT, fill=PALETTE["ink"])
    y += 120

    draw.text(
        (2870, y),
        "Note: This is a conceptual ER model.\nJoin tables such as cart, wishlist, and order item\nare represented as relationship diamonds with\nrelationship attributes where that reads more naturally.",
        font=SMALL_FONT,
        fill=PALETTE["muted"],
        spacing=5,
    )

    image.save(OUT_DIR / "er-diagram-chen.png")


def main() -> None:
    use_case_diagram()
    er_diagram()
    print(f"Rendered diagrams to {OUT_DIR}")


if __name__ == "__main__":
    main()
