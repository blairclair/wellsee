#!/usr/bin/env python3
"""Map drafting helper: python3 tabs/escape/tests/genmaps.py [--write]

Each level map is laid out here in coordinates (rects, lines, points) and printed
as the literal row arrays that live in js/content.js. With --write it replaces the
`map: [...]` array of each level below in content.js. content.js stays the source
of truth for the game; this is only a drafting tool, so hand edits to content.js
are fine too (just don't run --write afterwards without porting them back).
"""
import random, re, sys, pathlib

class M:
    def __init__(s, w, h, base):
        s.w, s.h = w, h
        s.g = [[base] * w for _ in range(h)]
        s.box(0, 0, w - 1, h - 1, "#")
    def set(s, x, y, ch):
        if 0 <= x < s.w and 0 <= y < s.h: s.g[y][x] = ch
    def rect(s, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.set(x, y, ch)
    def box(s, x0, y0, x1, y1, ch):
        for x in range(x0, x1 + 1): s.set(x, y0, ch); s.set(x, y1, ch)
        for y in range(y0, y1 + 1): s.set(x0, y, ch); s.set(x1, y, ch)
    def hl(s, y, x0, x1, ch): s.rect(x0, y, x1, y, ch)
    def vl(s, x, y0, y1, ch): s.rect(x, y0, x, y1, ch)
    def put(s, x, y, text):
        for i, ch in enumerate(text): s.set(x + i, y, ch)
    def pts(s, ch, *ps):
        for x, y in ps: s.set(x, y, ch)
    def rows(s): return ["".join(r) for r in s.g]

LV = {}

# ------------------------------------------------------------------ midway
# Three lanes. North: dark grass alleys with loot (hat, lantern, apple), rabbits.
# Centre: the lit boardwalk, fastest, watched by a searchlight, teacups and a
# cookie, and cut by the funhouse tent whose one-tile flap holds a jack-in-the-box.
# South: dirt service lane, rings + popgun, Eli, a second jack. Exit is north-east,
# so every lane has to turn north at the end.
def midway():
    m = M(84, 24, ",")
    m.rect(1, 1, 82, 6, '"')
    m.rect(1, 16, 82, 22, ".")
    m.hl(7, 1, 82, "B"); m.hl(15, 1, 82, "B")
    for x in (9, 10, 30, 31, 56, 57, 74, 75): m.set(x, 7, ",")
    for x in (16, 17, 44, 45, 66, 67): m.set(x, 15, ",")
    m.set(25, 15, "V"); m.set(62, 7, "V")
    # funhouse tent across the boardwalk with one flap
    m.rect(36, 8, 42, 14, "#"); m.hl(11, 36, 42, ","); m.set(39, 11, "j")
    # east boardwalk end is closed by a ticket booth: you must go north or south
    m.rect(76, 8, 82, 14, "B")
    # north alley fences and trees
    m.hl(3, 4, 20, "="); m.hl(5, 22, 34, "="); m.hl(2, 38, 52, "="); m.hl(4, 54, 68, "=")
    m.vl(70, 2, 6, "=")
    m.pts("T", (1, 1), (12, 1), (27, 1), (46, 6), (60, 1), (77, 6))
    m.pts("H", (6, 2)); m.pts("b", (50, 1)); m.pts("a", (66, 5)); m.pts("r", (26, 2), (58, 3))
    # boardwalk
    for x in (3, 15, 27, 47, 59, 71): m.set(x, 9, "l"); m.set(x, 13, "l")
    m.pts("S", (2, 11)); m.pts("f", (5, 10)); m.pts("k", (22, 12)); m.pts("u", (30, 10), (64, 12))
    m.pts("*", (52, 11)); m.pts("C", (24, 11))
    # south lane
    m.hl(18, 4, 14, "="); m.hl(20, 20, 34, "="); m.hl(18, 48, 60, "="); m.vl(70, 16, 20, "=")
    m.pts("o", (8, 20)); m.pts("E", (32, 18)); m.pts("G", (52, 21)); m.pts("r", (40, 21))
    m.pts("j", (66, 19)); m.pts("a", (80, 21))
    # exit, north-east
    m.pts("X", (82, 1), (82, 2), (82, 3))
    m.vl(78, 1, 4, "="); m.set(78, 5, '"')  # a fence before the exit: go around it
    return m

# ------------------------------------------------------------------ mirrors
# The glass maze (short, Lettie, mirrors flip your hands) or the backstage
# corridor around it (long, lamps, loot, the Unwilling waiting in the wings).
def mirrors():
    m = M(62, 25, ":")
    # backstage: an outer ring corridor, two tiles wide, walled off by tent canvas
    m.box(3, 3, 58, 21, "#")
    # glass maze inside x 4..57, y 4..20: cells of 2 floor + 1 mirror wall
    rnd = random.Random(31)
    cw, ch = (57 - 4) // 3, (20 - 4) // 3   # 17 x 5 cells
    m.rect(4, 4, 57, 20, "m")
    seen = set(); stack = [(0, 0)]; seen.add((0, 0))
    def cell(cx, cy): return 5 + cx * 3, 5 + cy * 3
    def open_cell(cx, cy):
        x, y = cell(cx, cy); m.rect(x, y, x + 1, y + 1, ":")
    open_cell(0, 0)
    while stack:
        cx, cy = stack[-1]
        nb = [(cx + dx, cy + dy, dx, dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
              if 0 <= cx + dx < cw and 0 <= cy + dy < ch and (cx + dx, cy + dy) not in seen]
        if not nb: stack.pop(); continue
        nx, ny, dx, dy = rnd.choice(nb)
        seen.add((nx, ny)); open_cell(nx, ny)
        x, y = cell(cx, cy)
        if dx == 1: m.rect(x + 2, y, x + 2, y + 1, ":")
        if dx == -1: m.rect(x - 1, y, x - 1, y + 1, ":")
        if dy == 1: m.rect(x, y + 2, x + 1, y + 2, ":")
        if dy == -1: m.rect(x, y - 1, x + 1, y - 1, ":")
        stack.append((nx, ny))
    # loops: knock out extra mirrors so there are several ways through
    for _ in range(26):
        cx, cy = rnd.randrange(cw - 1), rnd.randrange(ch)
        x, y = cell(cx, cy)
        if rnd.random() < 0.6: m.rect(x + 2, y, x + 2, y + 1, ":")
        else:
            if cy < ch - 1: m.rect(x, y + 2, x + 1, y + 2, ":")
    # maze mouths: west side by the start, east side by the exit, bail-outs north and south
    m.hl(12, 3, 4, ":"); m.hl(12, 55, 58, ":"); m.vl(30, 3, 4, ":"); m.vl(30, 19, 21, ":")
    # start / exit: straight across through the glass, or all the way round
    m.pts("S", (1, 12)); m.pts("X", (60, 11), (60, 12), (60, 13))
    # backstage contents: lamps, loot, the Unwilling, a cookie
    for (x, y) in ((10, 1), (22, 1), (38, 1), (50, 1), (10, 23), (24, 23), (40, 23), (52, 23)): m.set(x, y, "l")
    m.pts("f", (2, 4)); m.pts("H", (16, 2)); m.pts("a", (44, 1)); m.pts("o", (20, 22)); m.pts("b", (46, 23)); m.pts("p", (60, 2))
    m.pts("C", (34, 2), (28, 22)); m.pts("V", (58, 1))
    m.pts("k", (29, 12)); m.pts("M", (32, 11)); m.pts("l", (30, 7), (30, 16))
    m.pts("a", (18, 13))
    return m

# ------------------------------------------------------------------ pen
# Pens of the petting zoo. The trampled mud through the middle is direct but
# slow (water) and full of rabbits; the fence lanes round the north are long,
# dry and have the troughs (loot); the south lane is Tobias's.
def pen():
    m = M(80, 26, '"')
    m.pts("S", (2, 2))
    # pens: fenced squares with one gate each
    pens = [(6, 4, 18, 10, (12, 10)), (24, 4, 36, 10, (24, 7)), (42, 4, 54, 10, (48, 4)), (60, 4, 72, 10, (66, 10)),
            (12, 15, 24, 21, (18, 15)), (30, 15, 42, 21, (42, 18)), (50, 15, 62, 21, (56, 15))]
    for x0, y0, x1, y1, g in pens:
        m.box(x0, y0, x1, y1, "="); m.set(*g, '"')
    # mud channel through the middle row band
    m.rect(1, 12, 78, 13, "~"); m.rect(28, 11, 50, 14, "~")
    # rabbits in pens, food in troughs
    m.pts("r", (14, 8), (48, 8), (36, 19), (40, 12), (64, 8))
    m.pts("c", (9, 6)); m.pts("o", (33, 9)); m.pts("H", (30, 6)); m.pts("p", (51, 6)); m.pts("a", (70, 6)); m.pts("b", (21, 19)); m.pts("g", (39, 17)); m.pts("a", (60, 20))
    # lamps along the north lane
    for x in (10, 26, 44, 60, 74): m.set(x, 1, "l")
    m.pts("f", (4, 13))
    m.pts("F", (46, 23)); m.pts("E", (70, 16)); m.pts("V", (30, 24)); m.pts("V", (77, 13))
    m.hl(22, 4, 10, "="); m.hl(23, 66, 74, "=")
    m.pts("D", (26, 12))
    m.pts("X", (78, 23), (78, 24))
    m.pts("j", (75, 18))
    return m

# ------------------------------------------------------------------ carousel
# A carousel turns in the middle of the row. North: teacups (fast, they hit hard).
# Through the carousel: horses circle the poles, and the high-striker mallet sits
# at its hub. South: the dunk tank's water, slow, with the candy and apples.
def carousel():
    m = M(78, 26, ",")
    m.pts("S", (2, 12))
    # carousel: ring fence with 4 openings, hub tent with the mallet beside it
    cx, cy, R = 39, 12, 7
    for y in range(cy - R, cy + R + 1):
        for x in range(cx - R - 3, cx + R + 4):
            d = ((x - cx) / 1.4) ** 2 + (y - cy) ** 2
            if R * R - 7 <= d <= R * R + 6: m.set(x, y, "=")
    for (x, y) in ((cx, cy - R), (cx, cy + R), (cx - R - 2, cy), (cx + R + 2, cy), (cx - R - 1, cy), (cx + R + 1, cy), (cx-R-3, cy), (cx+R+3, cy)): m.set(x, y, ",")
    m.rect(cx - 1, cy - 1, cx + 1, cy + 1, "B"); m.set(cx, cy + 2, "g")
    m.pts("h", (cx - 6, cy - 3), (cx + 6, cy + 3), (cx - 5, cy + 4), (cx + 5, cy - 4))
    m.pts("l", (cx - 4, cy), (cx + 4, cy))
    # booth rows north and south of the carousel, gaps to cross
    m.hl(4, 1, 26, "B"); m.hl(4, 52, 76, "B"); m.hl(20, 1, 26, "B"); m.hl(20, 52, 76, "B")
    for x in (8, 9, 70, 71): m.set(x, 4, ","); m.set(x, 20, ",")
    # north: teacups
    m.pts("u", (20, 2), (40, 2), (60, 2)); m.pts("l", (30, 1), (50, 1)); m.pts("k", (66, 2))
    # south: dunk water
    m.rect(14, 21, 30, 24, "~"); m.set(22, 22, "D"); m.rect(48, 21, 60, 24, "~"); m.set(54, 23, "D")
    m.pts("c", (8, 23)); m.pts("a", (36, 23)); m.pts("a", (64, 22)); m.pts("H", (44, 24))
    m.pts("C", (24, 12), (60, 7)); m.pts("V", (39, 0 + 1)); m.pts("V", (39, 24))
    m.pts("j", (52, 12)); m.pts("f", (5, 14)); m.pts("b", (74, 2))
    m.vl(66, 8, 16, "B"); m.set(66, 12, ",")
    m.pts("X", (76, 11), (76, 12), (76, 13))
    m.pts("h", (12, 8)); m.pts("u", (60, 16))
    return m

# ------------------------------------------------------------------ silent
# The short way is straight through the silence; every one of the Unwilling
# standing out in the field hears you the moment you step in. The long way
# hugs the tree lines round the edge, past rabbits and two searchlights.
def silent():
    m = M(80, 26, '"')
    m.pts("S", (2, 12))
    # silence: a broad band straight across the direct line, and a second patch
    # before the exit. Inside it every one of the Unwilling hears you, and on
    # this field (silenceBoost) they run nearly as fast as you.
    for y in range(4, 22):
        x0 = 26 + (y - 4) // 3; m.hl(y, x0, x0 + 18, "s")
    m.rect(56, 8, 65, 17, "s")
    # tree lines bound the edge lanes (rows 1-3 and 22-24): longer, loud, safe from silence
    for x in range(6, 74, 3): m.set(x, 4, "T"); m.set(x, 21, "T")
    for y in range(7, 19, 3): m.set(6, y, "T"); m.set(73, y, "T")
    # dormant Unwilling standing in the field, Sam in the silence, Eli by the exit
    m.pts("C", (20, 8), (22, 17), (46, 6), (48, 19), (60, 6), (62, 19), (70, 10), (70, 15))
    m.pts("L", (36, 12)); m.pts("E", (58, 12)); m.pts("k", (40, 9))
    # edge lanes: searchlights and rabbits, and the loot
    m.pts("*", (14, 23), (64, 2)); m.pts("r", (24, 2), (52, 1), (32, 23), (58, 24))
    m.pts("p", (4, 2)); m.pts("o", (40, 2)); m.pts("a", (76, 2)); m.pts("b", (2, 23)); m.pts("G", (50, 23)); m.pts("a", (76, 23))
    m.pts("V", (44, 1), (36, 24))
    m.pts("X", (78, 11), (78, 12), (78, 13))
    return m

# ------------------------------------------------------------------ gallery
# Arthur Benning's portrait gallery. The lit hall down the middle is quick and
# it is his: long sight lines for the camera. The dark rooms either side are
# full of the Unwilling posed for their portraits, standing still... until his
# flash tells them where you are. The popgun is in the first room.
def gallery():
    m = M(78, 26, ".")
    m.pts("S", (2, 12))
    m.hl(9, 1, 76, "#"); m.hl(15, 1, 76, "#")
    for x in range(8, 72, 9): m.set(x, 9, "."); m.set(x + 4, 15, ".")  # doors between hall and rooms
    # rooms: partition walls north and south
    for x in range(14, 76, 12): m.vl(x, 1, 8, "#"); m.set(x, 4, "."); m.vl(x - 4, 16, 24, "#"); m.set(x - 4, 21, ".")
    m.set(10, 16, "#")
    # hall: lamps, Arthur, a cookie
    for x in range(6, 76, 10): m.set(x, 10, "l"); m.set(x + 5, 14, "l")
    m.pts("A", (40, 12)); m.pts("k", (30, 13)); m.pts("j", (56, 12)); m.pts("u", (66, 11))
    m.pts("C", (24, 14), (44, 14), (50, 10), (61, 14), (68, 10))  # portraits posed in the hall itself
    # rooms: posed figures, loot
    m.pts("C", (20, 3), (44, 6), (58, 3), (22, 20), (46, 18), (64, 22))
    m.pts("G", (6, 5)); m.pts("f", (4, 19)); m.pts("a", (30, 2), (62, 20)); m.pts("H", (52, 7)); m.pts("b", (34, 22)); m.pts("p", (70, 2)); m.pts("o", (56, 23))
    m.pts("j", (14, 4), (26, 21)); m.pts("E", (68, 18)); m.pts("V", (38, 1), (50, 24))
    m.pts("X", (76, 11), (76, 12), (76, 13))
    return m

# ------------------------------------------------------------------ bigtop
# The ring is the short way (silence in the sawdust, a searchlight), the
# bleachers round the outside the long way, and the crawlspace under the
# bleachers is in between: tight, dark, jack-in-the-boxes and supplies.
def bigtop():
    m = M(80, 28, ":")
    m.pts("S", (2, 25))
    cx, cy = 40, 14
    # bleachers: concentric booth ring with a crawlspace inside it
    for y in range(1, 27):
        for x in range(1, 79):
            d = ((x - cx) / 1.9) ** 2 + (y - cy) ** 2
            if 81 <= d <= 92 or 132 <= d <= 145: m.set(x, y, "B")
    # entrances: through both bleacher rings on the diagonals, crawlspace gaps
    for (x, y) in ((cx - 18, cy + 5), (cx - 17, cy + 5), (cx - 17, cy + 6), (cx + 17, cy - 5), (cx + 18, cy - 5), (cx + 17, cy - 6)): m.set(x, y, ":")
    for (x, y) in ((cx - 21, cy + 7), (cx - 22, cy + 7), (cx - 21, cy + 8), (cx + 21, cy - 7), (cx + 22, cy - 7), (cx + 21, cy - 8)): m.set(x, y, ":")
    for (x, y) in ((cx, cy - 12), (cx, cy + 12), (cx - 1, cy - 12), (cx + 1, cy + 12)): m.set(x, y, ":")
    # the ring
    m.rect(cx - 8, cy - 3, cx + 8, cy + 3, "s"); m.set(cx, cy, "*")
    m.pts("C", (cx - 6, cy - 4), (cx + 6, cy + 4)); m.pts("M", (cx + 10, cy - 2)); m.pts("L", (cx - 10, cy + 2))
    # crawlspace pickups and jacks
    m.pts("j", (cx, cy - 10), (cx, cy + 10)); m.pts("a", (cx - 14, cy - 6)); m.pts("p", (cx + 14, cy + 6)); m.pts("H", (cx - 12, cy + 7)); m.pts("o", (cx + 12, cy - 7))
    # outside: the long walk round
    m.pts("f", (4, 22)); m.pts("F", (8, 4)); m.pts("E", (70, 24)); m.pts("A", (66, 3)); m.pts("b", (2, 2)); m.pts("g", (77, 18)); m.pts("a", (40, 26))
    for (x, y) in ((20, 1), (60, 1), (20, 26), (60, 26)): m.set(x, y, "l")
    m.pts("V", (10, 14), (70, 14), (40, 1), (40, 26))
    m.pts("X", (77, 2), (78, 2), (78, 3))
    return m

# ------------------------------------------------------------------ gate
# The finale. The front gate is locked; three breakers (Y) open it, each takes
# a couple of seconds of standing on it. The Barker can't be killed: knock him
# back, lure him into the jack-in-the-boxes, keep the pillars between you.
def gate():
    m = M(58, 26, ".")
    m.hl(1, 1, 56, "=")
    m.rect(1, 1, 22, 2, "#"); m.rect(35, 1, 56, 2, "#")
    m.pts("X", (26, 1), (27, 1), (28, 1), (29, 1), (30, 1), (31, 1))
    m.rect(23, 1, 25, 2, "B"); m.rect(32, 1, 34, 2, "B"); m.set(23, 1, "#"); m.set(34, 1, "#")
    m.pts("l", (24, 3), (33, 3))
    # pillars to kite around
    for (x, y) in ((12, 8), (44, 8), (20, 14), (36, 14), (12, 19), (44, 19), (28, 9)):
        m.rect(x, y, x + 1, y + 1, "B")
    m.pts("T", (4, 6), (53, 6), (6, 23), (51, 23))
    m.pts("Y", (5, 13), (52, 13), (28, 22))
    m.pts("j", (9, 13), (48, 13), (28, 18))
    m.pts("R", (28, 5)); m.pts("S", (28, 24))
    m.pts("f", (24, 23)); m.pts("p", (32, 23)); m.pts("H", (16, 4)); m.pts("g", (41, 4)); m.pts("a", (3, 20)); m.pts("a", (54, 20)); m.pts("G", (28, 13))
    m.pts("V", (2, 4), (55, 4), (14, 24), (43, 24))
    m.pts("l", (10, 4), (47, 4), (20, 24), (37, 24))
    return m

LV = {"midway": midway, "mirrors": mirrors, "pen": pen, "carousel": carousel, "silent": silent, "gallery": gallery, "bigtop": bigtop, "gate": gate}

def js_rows(rows):
    q = lambda r: "'" + r + "'" if '"' in r else '"' + r + '"'
    return "\n".join("      " + q(r) + "," for r in rows)

if __name__ == "__main__":
    out = {k: f().rows() for k, f in LV.items()}
    if "--write" in sys.argv:
        p = pathlib.Path(__file__).resolve().parent.parent / "js" / "content.js"
        whole = p.read_text()
        cut = whole.index("export const LEVELS")  # level ids (e.g. gate) can also be obstacle ids
        head, src = whole[:cut], whole[cut:]
        for k, rows in out.items():
            pat = re.compile(r"(\n  " + k + r": \{.*?\n    map: \[\n)(.*?)(\n    \],)", re.S)
            if not pat.search(src): print("no level block for", k); continue
            src = pat.sub(lambda mt: mt.group(1) + js_rows(rows) + mt.group(3), src, count=1)
        p.write_text(head + src); print("wrote", ", ".join(out))
    else:
        for k, rows in out.items():
            print("==", k, f"{len(rows[0])}x{len(rows)}"); print("\n".join(rows))
