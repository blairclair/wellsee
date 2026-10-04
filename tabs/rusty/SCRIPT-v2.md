# The Tale of Rusty the Janitor: extended script (v2)

This is the extended script: 54 panels in ten chapters plus a cover. It does not replace `SCRIPT.md` yet. When the art team starts on v2, the tab lead promotes this table into `SCRIPT.md` and updates `index.html`.

**Panel ids.** The 27 existing panels keep their ids (`p01`–`p27`), because an id is a filename. New panels are `p28`–`p54`. They are numbered in the order they were written, not the order they are read, so use the **#** column for reading order.

**Lettering source.** The current lettering in `panels/pNN.js` takes precedence over `SCRIPT.md` where the two differ: p21's "He didn't run…" caption and p27's clown balloon are both kept here.

**Phone rule.** Each balloon is 12 words or fewer, and each panel has at most two short captions. On wide panels the balloons move into a strip under the art, so every wide panel's balloons are written to read in order without the picture.

---

## The shape of the story

**Before the light (Chapters 1–3).** We spend time with Rusty: his kindness at the school, his meetings, his son as a little boy, the bottle he keeps sealed, the scorched shirt, the speech he practises in the mirror. Under all of that, the world begins to go wrong. His name appears in chalk on a blackboard, the crickets stop, and the dogs lie down facing the hill.

**The refusal (Chapters 4–6).** This is the existing spine, almost untouched. The light comes, he says NOT TODAY, he walks to Mae's Diner, sees the reflection, leaves the rabbit, and is taken.

**Forever (Chapters 7–10).** The grind wears him down. Then the crooked house shows him his granddaughter growing up. He reaches out to her once, and that is what brings the carnival to her door. He meets her on the midway, and he is offered a way home that would cost her. He refuses again. They walk home at dawn and carry it with them. His name fades from everything except the trophy.

### Threads that pay off
| planted | paid off |
|---|---|
| p32: young Rusty teaches six-year-old Danny to count crickets: "Long as they're singing, nothing's coming." | p34 he is counting when they stop · p09/p10 three silent nights · p37 the crickets are back on Route 9 after Rusty leads the carnival away · p45 they stop on Carol's street · p47 "My dad says count the crickets…" / "Not here." |
| p32: Danny's sock rabbit, Mister Buttons, sewn by Carol | p08 why Rusty carves a rabbit · p37 Danny reads MR. BUTTONS on the base · p42/p44/p47 his granddaughter carries the rabbit everywhere |
| p29: the teachers don't know his name ("Thanks, Rudy.") · p30: someone does ("Russell.") | p48 his nametag has worn down to an R · p53 the tag is blank, and "The carnival never forgets a name." · p27 the trophy is the only place his name is still written |
| p33: the one sealed bottle, "so he'd know he was choosing" | p38 still sealed on his last night · p40 a shelf of sealed bottles in eternity |
| p05: Danny on the red bike, Carol laughing | p42 Danny steadies his own daughter on a red bike |
| p31: "Hi, I'm Russ." | p51 "No, sir." He gives up his name one more time |
| p13/p21: "Yeah. I did." | p54 "Yeah." |

---

## Panel table

`reuse`: **keep** means the art stands and at most the lettering changes. **keep+** means the art needs the changes listed. **new** means draw from scratch.
Span is the grid width: s2 is a third, s3 a half, s4 two-thirds, s6 full. The viewBox width is 200 × span. A viewBox height other than 600 is marked ★, and the lead has to check that row in `style.css`.

| # | id | ch / page | span | viewBox | mood | wear | Rusty outfit / expression | reuse | changes |
|---|----|-----------|------|---------|------|------|---------------------------|-------|---------|
| 1 | p01 | cover | s6 | 1200×700★ | cover | 0.6 | eternal / resigned, under the bulb | keep | none |
| 2 | p02 | 1 | s6 | 1200×600 | day | 0 | work / neutral, mopping | keep | none |
| 3 | p28 | 1 | s4 | 800×600 | day | 0 | work / gentle, kneeling to a sick child | new | |
| 4 | p03 | 1 | s2 | 400×600 | day | 0 | hands wringing the mop | keep | none |
| 5 | p04 | 1 | s2 | 400×600 | day | 0 | work / tender, the red mitten | keep | none |
| 6 | p29 | 1 | s2 | 400×600 | day | 0 | work / small smile, "Rudy" | new | |
| 7 | p05 | 1 | s2 | 400×600 | day | 0 | closet: photo and chip | keep | none |
| 8 | p30 | 1 | s6 | 1200×600 | night | 0 | work / uneasy, the blackboard | new | |
| 9 | p31 | 2 | s2 | 400×600 | day | 0 | work / shy, AA basement | new | |
| 10 | p32 | 2 | s4 | 800×600 | flashback | -0.5 | Rusty at 39 / warm, Danny at 6 | new | |
| 11 | p06 | 2 | s4 | 800×600 | flashback | -0.3 | young, drunk / graduation | keep | none |
| 12 | p07 | 2 | s2 | 400×600 | day | 0 | the letter (hands) | keep | none |
| 13 | p08 | 2 | s6 | 1200×600 | night | 0 | carving the rabbit | keep+ | add a sock-rabbit sketch labelled "Mr. Buttons" to the sketch page; caption change |
| 14 | p33 | 3 | s2 | 400×600 | night | 0 | hand on cupboard door, the sealed bottle | new | |
| 15 | p34 | 3 | s4 | 800×600 | night | 0 | undershirt / uneasy, the silence | new | |
| 16 | p35 | 3 | s2 | 400×600 | day | 0 | undershirt / dismay, scorched shirt | new | |
| 17 | p36 | 3 | s4 | 800×600 | night | 0 | shirt and tie / rehearsing ×3 | new | |
| 18 | p09 | 4 | s6 | 1200×600 | dawn | 0 | work / awe | keep+ | delete the cricket SFX and the "crickets still chirp" alt; new caption |
| 19 | p10 | 4 | s2 | 400×600 | dawn | 0 | the stopped cicada | keep+ | cicada's legs drawn in, head turned toward the hill; caption change |
| 20 | p11 | 4 | s2 | 400×600 | light | 0 | ticket lands | keep | none |
| 21 | p12 | 4 | s2 | 400×600 | light | 0 | fear, then resolve | keep | none |
| 22 | p13 | 4 | s6 | 1200×600 | light | 0 | anger, tears the ticket | keep | none |
| 23 | p14 | 5 | s3 | 600×600 | noon | 0 | suit / resolve, Route 9 | keep | none |
| 24 | p15 | 5 | s3 | 600×600 | noon | 0 | suit / tender, the window | keep+ | optional: a brown scorch at the shirt collar, peeking above the tie |
| 25 | p16 | 5 | s6 | 1200×600 | noon | 0 | suit / fear, the reflection | keep | none |
| 26 | p17 | 5 | s2 | 400×600 | noon | 0 | hand leaves the handle | keep | none |
| 27 | p18 | 5 | s2 | 400×600 | noon | 0 | rabbit on the sill | keep | none |
| 28 | p19 | 5 | s2 | 400×600 | noon | — | Danny at 1:40 | keep | none |
| 29 | p20 | 5 | s6 | 1200×600 | dusk | 0 | Danny in the doorway; the walkers | keep | none |
| 30 | p37 | 5 | s6 | 1200×360★ | dusk | — | Danny's hands, MR. BUTTONS | new | thin strip |
| 31 | p38 | 6 | s6 | 1200×360★ | night | 0 | suit / waiting, 11:58 p.m. | new | thin strip |
| 32 | p21 | 6 | s6 | 1200×800★ | lurid | 0 | suit / resigned, the door | keep+ | the sealed bottle on the table beside the ticket halves and knife |
| 33 | p22 | 6 | s3 | 600×600 | lurid | 0.1 | suit / anguish, dragged | keep+ | add the paint-tent glimpse through a flap (see beat) |
| 34 | p23 | 6 | s3 | 600×600 | lurid | 0.15 | suit / resigned, handed the mop | keep | none |
| 35 | p24 | 7 | s2 | 400×600 | grey | 0.3 | eternal / resigned, mopping blood | keep+ | wear 0.4→0.3 |
| 36 | p39 | 7 | s4 | 800×600 | grey | 0.35 | eternal / blank, humming | new | the Choir tent |
| 37 | p40 | 7 | s2 | 400×600 | grey | 0.4 | the bottle shelf | new | |
| 38 | p26 | 7 | s4 | 800×600 | grey | 0.45 | eternal / tender, talking to a rabbit | keep+ | **recompose s2→s4** (ARCHITECTURE.md already flags p26 for restaging); wear 0.8→0.45; nametag scuffed "RUSTY" |
| 39 | p41 | 8 | s6 | 1200×700★ | mirror* | 0.5 | eternal / stunned, rag in hand | new | crooked house |
| 40 | p42 | 8 | s4 | 800×600 | mirror* | 0.55 | eternal / the only smile in eternity | new | montage in one mirror |
| 41 | p43 | 8 | s2 | 400×600 | mirror* | 0.55 | finger writing in the grime | new | |
| 42 | p44 | 8 | s2 | 400×600 | night | — | Carol at 8, in bed | new | |
| 43 | p45 | 8 | s4 | 800×600 | mirror* | 0.6 | eternal / the moment he understands | new | one of the book's key panels |
| 44 | p46 | 9 | s6 | 1200×800★ | lurid | 0.65 | eternal / hiding, the procession | new | splash |
| 45 | p47 | 9 | s3 | 600×600 | lurid | 0.65 | eternal / kneeling, the rabbit | new | |
| 46 | p48 | 9 | s3 | 600×600 | lurid | 0.65 | eternal / frozen, the question | new | |
| 47 | p49 | 9 | s2 | 400×600 | lurid | 0.65 | eternal / the choice (silent) | new | mirrors p12's composition |
| 48 | p50 | 9 | s4 | 800×600 | lurid | 0.65 | eternal / gentle, the lie | new | |
| 49 | p51 | 9 | s6 | 1200×600 | lurid | 0.65 | eternal / eyes down, "No, sir." | new | |
| 50 | p52 | 10 | s6 | 1200×600 | dawn | 0.7 | eternal / behind the gate (silent) | new | silent |
| 51 | p54 | 10 | s2 | 400×600 | grey | 0.7 | eternal / resigned, "Yeah." | new | |
| 52 | p25 | 10 | s2 | 400×600 | grey | 0.8 | closet tally marks | keep+ | wear 0.6→0.8; the popsicle rabbit stays |
| 53 | p53 | 10 | s2 | 400×600 | mirror* | 0.9 | eternal / hollow, blank nametag | new | |
| 54 | p27 | 10 | s6 | 1200×1000★ | grey | 1.0 | eternal / resigned, the trophy | keep | optional blank nametag |

\* `mirror` is a **proposed new page mood** for the lead: the grey eternity palette with a cold silver-green cast, plus warm daylight that appears only inside the mirror glass. If the lead doesn't add it, use `grey`.

**Page rows** (each row sums to 6): Ch1 `p02 | p28 p03 | p04 p29 p05 | p30` · Ch2 `p31 p32 | p06 p07 | p08` · Ch3 `p33 p34 | p35 p36` · Ch4 unchanged · Ch5 `p14 p15 | p16 | p17 p18 p19 | p20 | p37` · Ch6 `p38 | p21 | p22 p23` · Ch7 `p24 p39 | p40 p26` · Ch8 `p41 | p42 p43 | p44 p45` · Ch9 `p46 | p47 p48 | p49 p50 | p51` · Ch10 `p52 | p54 p25 p53 | p27`.

**Section moods for `index.html`:** Cover `cover` · 1 `day` · 2 `day` · 3 `night` (proposed: the panel mood exists, but check it works as a section mood) · 4 `light` · 5 `noon` · 6 `lurid` · 7 `grey` · 8 `mirror`* · 9 `lurid` · 10 `grey`.

---

## Cover

**#1 · p01 · keep · splash, s6.** Unchanged. A single bulb hangs in the black above Rusty, who is stooped over his mop on a slick floor, and the big top glows behind him.
- CAP: *He never hurt anyone.*

---

## Chapter One: Hollis Creek

*Mood: warm fluorescent day. The school is shabby, safe and loud. The horror stays at the edges: in what the children draw, and at the window.*

**#2 · p02 · keep · wide, s6.** Unchanged: the corridor after hours, with Rusty mopping toward us.
- CAP: For thirty-one years, Russell Pruitt mopped the halls of Hollis Creek Elementary.
- CAP: The kids called him Rusty. Most of the teachers never learned his last name.

**#3 · p28 · NEW · two-thirds, s4.** The hallway outside the cafeteria at 3:05, during dismissal: backpacks and coats, and a crowd of kids in a ring holding their noses. In the middle, a small first-grader in a dinosaur sweatshirt stands rigid with shame next to a puddle of sick on the linoleum, his face red and his lip going. A young teacher at the edge of the ring is already herding the others away with one arm and her back to him. Rusty has come down on one knee to the boy's height, a big hand on the small shoulder, and with the other hand he shakes red sweeping compound from a can over the mess. It looks like sawdust. **Artists: make this the same red sawdust we will see on the midway later.** Camera at child height. The boy has started, just barely, to smile.
Creepy detail, quiet and unremarked: taped along the wall behind them is a row of crayon pictures under a sheet labelled *MY FAVORITE PLACE*. Most are houses and dogs, but three of them, by different children, show the same thing: a striped tent on a hill with yellow rays coming out of it.
- RUSTY: Happens to everybody, pal.
- RUSTY: Happened to me Tuesday.

**#4 · p03 · keep · s2.** Unchanged: his hands wringing the mop, with the worn wedding band.
- CAP: He never amounted to much.

**#5 · p04 · keep · s2.** Unchanged: the red mitten pinned low, at a child's eye level.
- CAP: But he tried to do his part.

**#6 · p29 · NEW · small, s2, tall framing.** The teachers' lounge doorway. In the foreground a young teacher holds a coffee and scrolls her phone without looking up. On the table is a big birthday card (*Happy Birthday, Phyllis!*) covered in signatures, and a sheet cake with one slice gone. Behind her, Rusty ties off a full trash bag and is already putting in a fresh one. He has a small, polite half-smile. He has not been offered cake and doesn't expect any.
- TEACHER: Thanks, Rudy.
- RUSTY: Any time.

**#7 · p05 · keep · s2.** Unchanged: the closet, the photo of Carol and Danny on the red bike, and the nine-year chip.
- CAP: Nine years sober.
- CAP: Nine years too late for the only person it should have mattered to.

**#8 · p30 · NEW · wide, s6.** Classroom 4 at nine p.m. Chairs are upside-down on the desks like dead insects. The only light is a cold blue streetlamp and the corridor glow behind Rusty, who stands in the doorway with his cart, a felt eraser in his hand. The blackboard has been washed clean, all except the bottom-right corner, where someone has written in a beautiful round copybook hand, the kind nobody is taught any more:
> *Russell.*

The chalk tray is empty, and the chalk sticks lie in a coffee can on his cart. On the *outside* of the black window beside the board there is a faint smear of white dust at about the height of a tall man's hand. Don't draw a figure. Rusty's face is half in shadow, puzzled rather than scared yet.
- CAP: Nobody at Hollis Creek called him Russell.
- CAP: He'd collected every stick of chalk at four.
- RUSTY (small): ...Kids.

---

## Chapter Two: The Letter

*Mood: day, broken by two flashbacks. The memory in p32 is the warmest image in the book: gold lamplight and a summer night. Spend it.*

**#9 · p31 · NEW · s2, tall.** A church basement: a circle of folding chairs, a dented coffee urn, styrofoam cups, and a hand-lettered banner, ONE DAY AT A TIME, with one letter peeling. A dozen tired, kind people sit in the circle. Rusty stands at his chair in his work shirt, turning the bronze chip over and over between thumb and forefinger. Through the high basement window, at ground level, a rabbit sits bolt upright on the dark lawn outside, very still, with gold eyes, facing away from the church toward the east. Nobody inside has noticed it.
- RUSTY: Hi. I'm Russ.
- ALL: Hi, Russ.
- CAP: Every Tuesday. He never missed one.

**#10 · p32 · NEW · two-thirds, s4, warm sepia-gold flashback.** Twenty-two years ago. Danny's small bedroom has rocket-ship wallpaper, a turtle nightlight, and a window open on a summer night with fireflies in it. Danny, **six**, lies tucked in up to the chin, clutching a lumpy sock rabbit with two mismatched button eyes (MISTER BUTTONS). Rusty **at 39** (full red hair, a red mustache, no paunch, sober, young) sits on the edge of the bed with one hand cupped beside his ear, listening, and his face is entirely happy. In the doorway, lit from the hall, Carol leans on the frame with her arms folded, smiling at them both. She is whole and well. This panel has the only lamplight in the book that isn't carnival light.
- SFX (outside, gentle, many): chrrr chrrr chrrr
- RUSTY: Hear 'em? Long as the crickets are singing, bud...
- RUSTY: ...nothing's coming. You count 'em.
- DANNY (sleepy): One... two...
- CAP: Before Carol got sick.

**#11 · p06 · keep · two-thirds, s4, sepia flashback.** Unchanged: the graduation.
- CAP: Ten years ago. Danny's graduation. Rusty doesn't remember what he said.
- CAP: Danny does.
- DANNY: Don't come. Don't call. Don't **EVER.**

**#12 · p07 · keep · s2.** Unchanged: the letter in trembling hands.
- CAP: Then, ten years later, the mail came.

**#13 · p08 · keep+ · wide, s6, night.** As drawn: the lamp, the carving, the shavings, the suit on the door, the huge shadow. **Change:** among the rabbit sketches on the page, one is clearly a floppy *sock* rabbit with button eyes, labelled in his blocky hand *Mr. Buttons*. He isn't carving just any rabbit. He's remaking one.
- CAP: Four nights. He'd never made anything for anyone.
- THOUGHT (Rusty): Don't you mess this up, Russ. Not this one.

---

## Chapter Three: Three Nights

*Mood: night. The ordinary preparations of a nervous man, while the world outside goes quiet. Every panel is domestic, and every panel has one wrong thing in it.*

**#14 · p33 · NEW · s2, silent apart from captions.** Rusty's kitchen at night, close. A cupboard door stands open. On the top shelf, alone, sits one sealed bottle of whiskey with the tax stamp unbroken and dust thick on its shoulders. Danny's letter is propped against it, the handwriting toward us. Rusty's hand rests on the cupboard door, not on the bottle. The door's shadow is about to close over the bottle.
- CAP: He kept one bottle. Sealed.
- CAP: So every night he'd know he was choosing.

**#15 · p34 · NEW · two-thirds, s4.** Wednesday, past midnight. Rusty sits in his undershirt at the kitchen table by an open window, the half-carved rabbit in one hand and the knife paused in the other. He has turned his head to the window, listening. Outside is a street of small houses under a sodium lamp, and in every yard a dog is lying down, chin on paws, *every one facing the same way*: toward the dark line of the hill beyond the town. One dog's chain lies slack across the grass. On the window sill, a moth has folded itself up neatly, like a letter.
- RUSTY (small, trailing): ...forty-one... forty-two...
- SFX (struck through, fading): chrrr
- CAP: Wednesday night, the crickets stopped.
- CAP: He told himself it was the cold.

**#16 · p35 · NEW · s2, tall.** Thursday morning, in the apartment's grey light. Rusty holds up his one good white shirt at arm's length. There is a scorched brown triangle on the collar, in the exact shape of the iron, which stands on the board behind him still smoking a little. His face is crumpled with dismay. On the wall, slightly crooked, hangs his wedding photo: Carol laughing, and Rusty young and red-haired in a borrowed suit.
- RUSTY: What do I even say to him, Carol?
- CAP: The tie would cover it. Mostly.

**#17 · p36 · NEW · two-thirds, s4, night.** Friday, before his shift. The bathroom's three-panel medicine-cabinet mirror is angled so that we see Rusty three times, in shirt and tie, rehearsing. The camera is behind his shoulder, so the panel is all mirror. **Left glass:** stiff and formal, chin up. **Middle glass:** a forced, too-wide grin, one hand raised in a wave. **Right glass:** his face crumpling, his hand over his mouth. Behind him in the reflections is the small frosted bathroom window, dark in the real room. *In the right-hand glass only*, the window shows the hill beyond town, and on it a faint gold glow. Draw the glow no brighter than a held breath.
- RUSTY (left): Danny. Son.
- RUSTY (middle): Hey, Dan! You look good.
- RUSTY (right): I'm sorry.

---

## Chapter Four: The Light

*Kept almost as it is. It now arrives on the third silent night, as the Book says it must.*

**#18 · p09 · keep+ · wide, s6, dawn.** As drawn: Rusty from behind beside the pickup with his thermos, and the carnival blazing on the hill where the cornfield was. **Changes:** delete the cricket SFX, and remove "crickets still chirp" from the alt text. The grass is silent. If there's room, a few crickets lie on the asphalt at his boots with their legs drawn up.
- CAP: Saturday. Dawn. He'd waxed the gym all night. Couldn't sleep anyway.
- CAP: Three nights since the crickets stopped.

**#19 · p10 · keep+ · s2, silent.** As drawn, with one change: the cicada on the fencepost has *stopped*. Its legs are drawn in and its head is turned toward the carnival, like every insect in the Book's Plate I. Keep the struck-through *chrrr*.
- CAP: Not one had started up again.

**#20 · p11 · keep · s2.** Unchanged: the shaft of light, and the ticket ADMIT ONE · TONIGHT.

**#21 · p12 · keep · s2.** Unchanged: the gold-lit close-up.
- THOUGHT: Any other day.
- THOUGHT: Any other day, I'd come quiet.

**#22 · p13 · keep · wide, s6.** Unchanged: RRRIP. The sky turns red, and an Unwilling waves under the dead light pole.
- SFX: RRRIP
- RUSTY: Not today. You hear me?
- RUSTY: **NOT TODAY.**
- UNWILLING (tiny, far): ...tonight, then.

---

## Chapter Five: Mae's Diner

*Unchanged except for one new strip at the end. This is the spine of the book. Don't touch it.*

**#23 · p14 · keep.** Route 9, with the balloons leaning toward him.
- CAP: Six miles. The truck wouldn't start. Of course it wouldn't.

**#24 · p15 · keep+ (optional).** 11:58, his hand on the glass. Optional: a brown scorch mark just visible at his collar above the knot of the tie.
- CAP: 11:58.
- THOUGHT: Look at you, son.

**#25 · p16 · keep.** The reflection.
- CAP: And in the glass, he saw them.
- CAP: Waiting. Watching to see who he'd lead them to.

**#26 · p17 · keep, silent.** The hand leaves the handle.

**#27 · p18 · keep.** The rabbit on the sill, *for the baby*.
- CAP: He'd done the one thing he came here to do.

**#28 · p19 · keep.** 1:40, and the cold coffee.
- DANNY: He's not coming.
- DANNY: He was never coming, Jess.

**#29 · p20 · keep.** Dusk. Danny in the doorway, and the walkers on the horizon.
- CAP: Danny found it when they closed up.
- CAP: He never knew how close his father came.

**#30 · p37 · NEW · thin strip, s6, 1200×360★.** Close on Danny's hands at the diner's lit doorway, turning the little rabbit over. On the underside, carved small and careful in capitals, are the words MR. BUTTONS. His thumb rests on the letters. At the right edge of the strip, out of focus, the grass along Route 9 is full of tiny dark shapes, and the air above it is full of sound. The crickets are back on this road, because the carnival's attention has walked away with Rusty.
- SFX (soft, filling the strip): chrrr chrrr chrrr chrrr
- DANNY (whisper): ...Mister Buttons.

---

## Chapter Six: The Taking

*Kept, with one new opening strip.*

**#31 · p38 · NEW · thin strip, s6, 1200×360★, silent.** Rusty's apartment at night, framed as one long low strip at seated height. **Left:** the kitchen clock reads 11:58, an echo of the diner clock. **Centre:** Rusty's hands rest flat on the knees of his good brown suit, very still, the wedding band catching the light. **Right:** on the table lie the two halves of the torn ticket, the carving knife, and the bottle, *still sealed*. Under the door, a line of red-gold light lies across the floor, growing.

**#32 · p21 · keep+ · splash, s6.** As drawn. **Change:** add the sealed bottle to the table beside the ticket halves and the knife, since it's established in p38.
- CAP: He didn't run. He was already wearing his good suit.
- UNWILLING: YOU *REFUSED* US, RUSSELL.
- RUSTY: Yeah.
- RUSTY: I did.

**#33 · p22 · keep+ · s3.** As drawn: dragged down the midway, with the man in the cage screaming. **Change:** one tent flap at the side hangs open on a lit interior. Inside, a man in a barber's chair has his face being whitened by long gloved fingers, and a wide red grin is being painted *over* his own mouth. He is laughing and crying at once. Keep it small and partly blocked by the flap, so the reader barely catches it. It sets up p23's "we paint."
- SFX: AAAAAAAAAHHH
- CAP: Men screamed until their lungs gave out.
- UNWILLING: The ones who come get to go *HOME.*

**#34 · p23 · keep · s3.** The mop, the bucket, and the nametag that already says RUSTY.
- UNWILLING: Most who make us come for them, we paint.
- UNWILLING: *You, we KEEP.*
- UNWILLING: Forever is a long shift, Rusty.

---

## Chapter Seven: The Night Shift

*Mood: grey. This is the grind. Rusty is going numb, and the panels should make the reader feel it happening.*

**#35 · p24 · keep+ · s2.** As drawn: mopping blood under the booth. Wear drops from 0.4 to 0.3, because the decline now has longer to run.
- CAP: Every night.
- CAP: The same night.

**#36 · p39 · NEW · two-thirds, s4.** Inside the Choir tent. Tiered benches rise into the dark like a church gallery, and on them sit rows of people with their mouths stretched open, perfectly still. Their chests do not move. They are not breathing. From the top row, organ pipes rise out of the dark, and thin red threads run from each open mouth to the pipes, like the line labelled *the note, departing* in the Book's Plate IV. In the aisle at the bottom, small in the frame, Rusty mops the boards with his head down, and his lips are moving. He is humming. Music notes drift from the pipes, the steam-organ waltz, and the same notes come out of Rusty's mouth.
- CAP: After a while, he stopped hearing them.
- CAP: Then he caught himself humming along.

**#37 · p40 · NEW · s2, tall.** The eternal broom closet, the same one as p25 but seen from the other wall. Shelves run floor to ceiling, and further back than the closet can possibly go, and every shelf is lined with sealed bottles: hundreds of them, then thousands, the nearest bright and the farthest furred with grey dust. In the foreground a long white four-fingered glove sets down one more bottle, and a tag on its neck reads *Long night.* Rusty's hand is at the edge of the frame, not reaching for it.
- CAP: At the end of every shift, they leave him a bottle.
- CAP: He hasn't opened one.

**#38 · p26 · keep+, recompose to two-thirds, s4.** The break behind the big top, now with room to breathe. Rusty sits on an upturned bucket under a single bulb on a pole, turning the little popsicle-stick rabbit in his fingers. Beside him a rabbit-thing squats against the canvas, gnawing something long and pale. Show only the end of it, and let a scrap of cloth still be on it. Rusty is talking to the rabbit-thing gently, the way he talked to the sick boy in p28. The rabbit-thing has stopped chewing. Its torn ear is cocked toward him, and it seems to be listening. Wear 0.45. His nametag still reads RUSTY, scuffed.
- RUSTY: My boy's got a little girl by now. Maybe two.
- RUSTY: I bet she's got his eyes.

---

## Chapter Eight: The Crooked House

*Mood: `mirror` (proposed). Eternity is grey, and the world inside the glass is warm and morning-lit. This chapter is the cruellest hope in the book: let it be lovely, then let it close.*

**#39 · p41 · NEW · wide splash, s6, 1200×700★.** The crooked house is a mirror maze with warped floors and leaning frames, lit by one bulb. Rusty works through it with a rag and a spray bottle. **The reflections are wrong.** His own reflections stand still and watch him instead of polishing. In several mirrors there are people *inside* the glass, pale, pressing their palms flat against it from the other side, mouths moving soundlessly. These are the kept. One leaves a handprint in fog on the inside of its glass. Only one mirror, at the centre and cleaner than the rest, shows something else: daylight, and a small kitchen with yellow curtains. Danny, older, is spooning food to a baby in a high chair, and on the high-chair tray sits a small wooden rabbit. Rusty has stopped dead in front of it, the rag hanging from his hand. Wear 0.5. His nametag has worn down to **RUST**.
- CAP: The kept live in the mirrors. His job was to polish them.
- CAP: In one of them, it was morning.
- RUSTY (whisper): ...Danny?

**#40 · p42 · NEW · two-thirds, s4, montage in one frame.** The one good mirror fills the panel, its warped gilt frame cracked, and inside it **three moments stand side by side as if the glass had been folded**. **(a)** A girl of about four wobbles on a little red bike with training wheels, and Danny jogs beside her with a hand on the seat. This deliberately echoes the p05 photo. **(b)** A birthday cake with six candles. Jess laughs, and the girl, **auburn-haired like her grandmother**, has the wooden rabbit tucked under one arm. **(c)** The girl at the kitchen table at about seven, holding up a crayon drawing titled MY GRANDPA. The drawing is a stick man with a big orange question mark for a face. Danny, looking at it, has a complicated, sad expression. Below the frame, at the bottom of the panel, Rusty's face is lit warm by the glass. He is smiling. It is the only smile anywhere in eternity.
- CAP: He polished that mirror every shift.
- CAP: He watched her grow up through the glass.

**#41 · p43 · NEW · s2, tall, close.** Rusty's forefinger, filthy and with the wedding band loose on it now, writes in the grey grime and breath-fog on his side of the good mirror. The letters are shaky:
> DANNY I CAME

Through the letters, the warm kitchen is out of focus. A smear of the grime has run like a tear.
- CAP: He only wanted them to know.

**#42 · p44 · NEW · s2, tall, night (her world).** The girl's bedroom at night. She is about eight, with auburn hair and a crocheted blanket. She is sitting up in bed with the wooden rabbit held to her chest, looking at the window, where the frost on the glass has formed letters reading the right way round from her side: DANNY I CAME. Her face is wondering and hopeful. Through the frost, past the letters, a hill on the horizon holds a faint gold glow. This is the same held-breath glow as Rusty's bathroom mirror in p36. **The reader should get it here, a beat before Rusty does.** No caption.
- GIRL (whisper): I wish I could meet him.

**#43 · p45 · NEW · two-thirds, s4, silent. KEY PANEL.** The camera is *inside* the mirror, looking out at Rusty. His face fills most of the frame and both palms are flat on the glass. His finger-written letters run across the foreground, reversed from this side (letter it as mirrored text, not respelled). Laid faintly over his face, like a reflection, is her street at night, and in every yard a dog lies down, every one facing the hill. A tiny struck-through *chrrr* hangs over the hedges. His expression is the moment of understanding: no scream yet. His eyes are wide and wet, his mouth has just opened, and his face has gone completely slack. He realises that his one message is what called it to her. The carnival light from the hill falls across him gold, the same gold as p11. Give this panel the most care of any in the chapter.
- SFX (tiny, struck through, over her street): chrrr

---

## Chapter Nine: Light Night

*Mood: lurid. Rusty's family walks up the midway like everyone else does. The scene is warm, rapt, and terrible.*

**#44 · p46 · NEW · splash, s6, 1200×800★.** Night on the midway, seen from low behind the carousel. **Foreground:** the carousel horses, painted and wild-eyed, with their mouths open as if saying something. Rusty half-hides behind a brass pole with his mop, peering out, and one hand has gone to his nametag. **Midground and background:** the procession of townsfolk walking up the midway in nightclothes and coats thrown on over them. They carry what they were holding when the light came: a dinner plate, a book, a teacup. Their faces are turned up to the bulbs, rapt, the way flowers turn to the sun. Their long shadows stretch back down the midway toward the gate, some of them ending in reaching fingers. Among the crowd, **Danny (about 37) and Jess walk with faces turned up like the rest**, and between them, holding a hand of each, is **Carol (8)** in a puffy coat over pyjamas, with the wooden rabbit under her arm. **She is the only one in the crowd not looking up.** She is looking around, curious, toward the carousel. Rabbit-things stand at the edges of the midway, and every one of them is already looking at her.
- CAP: When the light comes, everybody goes.

**#45 · p47 · NEW · half, s3.** Beside the carousel. Carol has drifted from her parents, and the wooden rabbit has fallen into the red sawdust (the same red as p28). Rusty kneels to pick it up and stays kneeling, at her height, exactly as he did for the boy in p28. Close on the rabbit in his grey hands: the carving has been worn smooth by eight years of a child's hands, and the button-eye dots have nearly rubbed away. She looks at him with no fear at all.
- GIRL: My dad says count the crickets, and nothing bad comes.
- GIRL: There aren't any here.
- RUSTY: No, sweetheart. Not here.

**#46 · p48 · NEW · half, s3.** Same moment, wider. Carol peers at his nametag. It has worn down to a single faded **R**. Behind her, crouched so low that its knees rise above its painted head, an Unwilling folds itself down over her. One long gloved hand hovers *an inch* above her hair, not touching. Its pinprick eyes are on Rusty, not on her, and it is whispering past her ear to him. Rusty is frozen.
- GIRL: Do you know my grandpa? Russell?
- UNWILLING (whisper): Tell her. She takes the mop. You walk home with your boy.
- CAP: She had her grandmother's eyes.

**#47 · p49 · NEW · s2, silent.** Rusty's face, composed to echo p12 (the same extreme close-up, lit from above), but now it is grey, unshaven, and old, the light is red rather than gold, and there is no sweat, only one tear held on the lower lid that doesn't fall. In each pupil there is a tiny reflection of the girl.

**#48 · p50 · NEW · two-thirds, s4.** Rusty closes Carol's small hands around the wooden rabbit, his big grey hands folded over hers, and smiles at her. It's the best smile he has left, and it's a little broken. Behind her, the Unwilling's hovering hand slowly withdraws, and its painted grin widens as if he has done something funny. Keep it small and ordinary: an old janitor being nice to a kid.
- RUSTY: Never heard of him, sweetheart.
- RUSTY: You hold on to that.

**#49 · p51 · NEW · wide, s6.** Danny pushes through the crowd, relieved, scooping Carol up onto his hip. Then he stops and looks at the old janitor still kneeling in the sawdust: at the drooping white walrus mustache, the stoop, the hands. Something crosses Danny's face, almost. Rusty keeps his eyes down on the mop. Danny's first line is the only place the book says the girl's name: no caption, so the reader gets it on their own. **Lettering order (for the phone strip):**
- DANNY: Carol! There you are.
- DANNY: ...Have we met?
- RUSTY: No, sir.

---

## Chapter Ten: Forever

*Mood: grey, opening on one cold dawn. Every flicker of hope from the book is closed here.*

**#50 · p52 · NEW · wide, s6, dawn, SILENT.** The carnival gate at grey dawn, seen from inside. Through the tall iron bars, the procession walks home down the hill into the morning, their shadows now stretching *back up the hill toward the carnival*. Carol rides on Danny's shoulders and has turned round to wave the wooden rabbit at the gate. Danny walks with his face forward, smiling, and the smile has gone on a little too long. In the foreground, filling the bottom of the frame: Rusty's two grey hands wrapped round the mop handle against the bars, and on his chest the nametag, nearly blank, the R almost gone. No captions and no balloons. The cost is in the image.

**#51 · p54 · NEW · s2.** Inside the gate. An Unwilling stands beside Rusty, its long arm resting on his shoulder, and the bulbs are going pale overhead. Rusty is looking at the empty road. The two of them are framed like coworkers at the end of a shift.
- UNWILLING: You'll always say no. Won't you, Russell.
- RUSTY: Yeah.

**#52 · p25 · keep+ · s2.** As drawn: the tally marks that stop, the bent nail, the popsicle rabbit, and the chip. Wear 0.8.
- CAP: He stopped counting at 14,000.

**#53 · p53 · NEW · s2, tall.** The crooked house again, and the good mirror. It shows nothing now except what a mirror shows: Rusty, grey, stooped, and thin. His nametag is **completely blank**. Behind him in the reflection the other kept press their palms to their glass, but this one mirror holds no one but him. Faint on the glass, too faint to read unless you look, is the ghost of where DANNY I CAME was written and wiped away.
- CAP: Some nights he can't remember what his tag said.
- CAP: The carnival never forgets a name.

**#54 · p27 · keep · final splash, s6, 1200×1000★.** As drawn: the empty stage, the confetti and blood, and the gold trophy three times his height with EMPLOYEE OF THE MONTH and **RUSTY · RUSTY · RUSTY** engraved down the plaque, the scroll unrolling off the stage. Rusty stands beside it on his mop, unhappy and resigned, past crying, and the gloved hands clap. **Change:** none required in the art. Optionally show his blank nametag, so the plaque is the only place his name appears. The lettering is unchanged. (The new line "The carnival never forgets a name." sits on p53, just before this panel.)
- CAP: Every month.
- CAP: Forever.
- SFX: clap. clap. clap.
- UNWILLING (off-panel): Smile, Rusty. It's *always* your month.

---

## For the model team: new characters, props and locations

| item | first panel | notes |
|---|---|---|
| **Rusty at 39** (`rustyYounger`?) | p32 | Sober and happy. Full red hair, red walrus mustache, no paunch, no stoop. Plain t-shirt. Younger than `rustyYoung` (p06). |
| **Danny at 6** | p32 | Freckled, with a cowlick. Matches the boy in the p05 photo (who is about five there). |
| **Carol Pruitt (alive), full figure** | p32, p35 (wedding photo) | Auburn hair, a warm laugh. Today she exists only as a photo head. |
| **Mister Buttons** (prop) | p32, p08 sketch | A lumpy grey sock rabbit with mismatched button eyes. |
| **Carol, the granddaughter** | baby p41 · about 4, 6 and 7 in p42 · 8 in p44–p52 | Auburn hair like her grandmother. She has Danny's (that is, Carol's) eyes. At 8: puffy coat over pyjamas. Always carries the wooden rabbit. |
| **Danny at about 37** | p41–p52 | A little heavier, the first grey at his temples, the same nose. Flannel. |
| **Jess at about 37** | p42, p46 | Same as Jess now, older. |
| **Wooden rabbit, worn** (prop) | p44–p52 | `R.woodRabbit` with the knife marks smoothed out by years of handling. MR. BUTTONS carved on its base (p37). |
| **Nametag text** (param) | throughout | Needs a text parameter: `RUSTY` (p23–p26) → `RUST` (p41–p43) → `R` (p46–p52, fading) → blank (p53, optionally p27). Add-only change to `model.js`. |
| **Sealed whiskey bottle** (prop) | p33, p38, p21, p40 | Tax stamp unbroken, dusty shoulders. |
| **Townsfolk, procession** | p46, p52 | Nightclothes and coats, faces turned up, carrying a plate, a book, a teacup. Generic and reusable. |
| **First-grader, teacher, AA members** | p28, p29, p31 | Ordinary, warm-palette, secondary figures. |
| **The Choir** | p39 | Seated, unbreathing figures with stretched-open mouths and red threads running to the organ pipes. |
| **The kept in mirrors** | p41, p53 | Pale figures inside the glass, palms pressed flat, the occasional fog handprint. |
| **Unwilling poses** | p48 crouch-hover, p54 arm-on-shoulder | Probably custom `arms`, or a new `PPOSE` appended to the existing set. |

**New locations:** the cafeteria hallway at dismissal (p28) · the teachers' lounge (p29) · Classroom 4 at night (p30) · a church basement (p31) · Danny's childhood bedroom (p32) · Rusty's kitchen with the cupboard and the street of dogs (p33, p34) · his bathroom with the three-panel mirror (p36) · the Choir tent (p39) · the bottle wall of the eternal closet (p40) · the crooked house (p41, p53) · Danny's kitchen and the girl's bedroom (p41–p44) · the carousel on the midway (p46–p51) · the carnival gate at dawn (p52, p54).

---

## Tone guide for artists

1. **Implication before gore.** The scariest thing in each panel should be easy to miss: three crayon tents, chalk dust on the *outside* of a window, dogs all facing one way, a glow only in the mirror, a scrap of cloth on a bone. Blood is fine, and he mops it, but let it be the floor rather than the subject.
2. **Wrongness in ordinary places.** Chapters 1–3 are warm, lived-in and specific: coffee urns, crayon art, a scorched collar. The horror lands because the ordinary world is drawn with love first.
3. **The silence is a character.** Wherever the insects stop, draw the absence: struck-through SFX, folded moths, cicadas facing the hill. Wherever they're singing (p32, p37), let the SFX fill the air softly.
4. **Light is the antagonist.** The carnival's gold is beautiful, the colour of your mother's kitchen (the Book), and it should be the most attractive colour in every panel it appears in. Red comes underneath it when it turns.
5. **The Unwilling are people.** They are tall, gentle, patient and amused. Never let them snarl. They whisper, wave and clap. Keep their hands close to people without touching them (p48).
6. **Rusty never cries on-panel** except for the one held tear in p49. By p27 he is past it.
7. **Less boxy.** Vary the shapes: the thin strips (p37, p38), the tall s2 panels, the splashes (p41, p46). Let silent panels (p17, p38, p45, p49, p52) have room. The lead may want borderless bleeds for p45 and p52, and irregular gutters in Chapter 8 (the mirrors).
8. **Recurring compositions are deliberate:** p28 ↔ p47 (kneeling to a child) · p12 ↔ p49 (the face close-up) · p05 ↔ p42 (the red bike) · p16 ↔ p46 ("who he'd lead them to"). Rhyme the camera angles.

---

## Notes for the lead and open questions

- **Season and pregnancy.** p02 shows paper turkeys (November), and the book needs crickets. That's fine as "the last crickets of a warm autumn". The letter says Jess is due in March, which puts her at about five months in November, not seven as `SCRIPT.md` says. Recommendation: describe her as "showing", which p15 and p16 already draw.
- **Silence timing changed to match the Book** ("three nights after the silence, the light comes"). The crickets now stop on Wednesday (p34), and p09 and p10 are adjusted to suit.
- **The Pruitt surname** is not touched as a plot point. No barefoot child Unwilling and no dog request (those are Eli's, on the clowns tab).
- **The granddaughter's name**, Carol, after her grandmother, is revealed only in Danny's line in p51. Until then her balloons must use `who: "Girl"`, and the alt text of p41–p50 must call her "the girl". Both `who` (shown in the mobile lettering strip) and `alt` (read aloud as the aria-label) would otherwise give the name away early. The name "Carol" appears in this script only for the team.
- **Height-changed rows (★)** need the lead to confirm in `style.css`: the thin strips p37 and p38 (1200×360), the tall splash p41 (1200×700), and the splash p46 (1200×800, the same height as p21's).
