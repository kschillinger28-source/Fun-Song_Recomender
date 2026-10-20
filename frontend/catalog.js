'use strict';

// Hand-built song catalog. This is the Sprint 1 stand-in for the AI call: recommender.js
// scores these songs against the song the user picked. A later sprint replaces both
// files with a request to an LLM.
//
// families: broad genre groups used for matching (rock, indie, pop, hiphop, rnb,
//           electronic, country, folk, metal, latin)
// tags:     style words shared across genres (guitar, synth, dance, acoustic, ...)
// energy:   1 = calm ... 5 = intense
const CATALOG = [
  // ---- Rock & indie ----
  { name: "Take Me Out", artist: "Franz Ferdinand", year: 2004, genre: "Alternative", families: ["rock", "indie"], tags: ["guitar", "dance", "punk"], energy: 4, blurb: "The Scottish band's breakout hit starts as a tense, stuttering groove, then lurches into a faster, full-speed chorus." },
  { name: "Float On", artist: "Modest Mouse", year: 2004, genre: "Alternative", families: ["indie"], tags: ["guitar", "upbeat"], energy: 3, blurb: "A relentlessly upbeat hit whose lyrics are full of dry, offbeat humor." },
  { name: "1901", artist: "Phoenix", year: 2009, genre: "Alternative", families: ["indie", "pop"], tags: ["synth", "dance", "upbeat"], energy: 4, blurb: "The French band's best-known song, built on bright synths and a soaring chorus." },
  { name: "Rebellion (Lies)", artist: "Arcade Fire", year: 2004, genre: "Alternative", families: ["indie"], tags: ["guitar", "anthemic"], energy: 4, blurb: "A pounding piano and a swelling wall of instruments made this song from “Funeral” the one that put Arcade Fire on the map." },
  { name: "Last Nite", artist: "The Strokes", year: 2001, genre: "Rock", families: ["rock", "indie"], tags: ["guitar", "riff", "retro"], energy: 4, blurb: "A garage-rock hit from the debut “Is This It” that helped kick off the early-2000s guitar-rock revival." },
  { name: "Somebody Told Me", artist: "The Killers", year: 2004, genre: "Rock", families: ["rock", "indie"], tags: ["synth", "dance", "guitar"], energy: 4, blurb: "From the same debut album as “Mr. Brightside”, with a driving, danceable 80s new-wave feel." },
  { name: "Mr. Brightside", artist: "The Killers", year: 2003, genre: "Rock", families: ["rock", "indie"], tags: ["guitar", "synth", "anthemic"], energy: 5, blurb: "The band's breakout single, an anxious, jealous love song with one of the decade's most singable choruses." },
  { name: "Seven Nation Army", artist: "The White Stripes", year: 2003, genre: "Alternative", families: ["rock"], tags: ["riff", "guitar", "anthemic"], energy: 5, blurb: "Built on a riff that sounds like a bass but is really a guitar run through an effects pedal. It became a stadium chant." },
  { name: "Do I Wanna Know?", artist: "Arctic Monkeys", year: 2013, genre: "Alternative", families: ["rock", "indie"], tags: ["riff", "moody", "guitar"], energy: 3, blurb: "A slow, slinking riff opens this moody single from “AM”." },
  { name: "Smells Like Teen Spirit", artist: "Nirvana", year: 1991, genre: "Rock", families: ["rock"], tags: ["grunge", "riff", "guitar"], energy: 5, blurb: "The lead single from “Nevermind” that pushed grunge into the mainstream." },
  { name: "Under the Bridge", artist: "Red Hot Chili Peppers", year: 1991, genre: "Rock", families: ["rock"], tags: ["mellow", "guitar"], energy: 2, blurb: "A slow-building ballad about loneliness in Los Angeles." },
  { name: "Creep", artist: "Radiohead", year: 1992, genre: "Alternative", families: ["rock", "indie"], tags: ["moody", "guitar"], energy: 3, blurb: "Quiet verses give way to a crashing guitar chorus in Radiohead's breakout single." },
  { name: "Wonderwall", artist: "Oasis", year: 1995, genre: "Rock", families: ["rock"], tags: ["britpop", "acoustic", "anthemic"], energy: 3, blurb: "One of the defining Britpop songs, from “(What's the Story) Morning Glory?”." },
  { name: "Yellow", artist: "Coldplay", year: 2000, genre: "Alternative", families: ["rock", "indie", "pop"], tags: ["mellow", "guitar", "anthemic"], energy: 3, blurb: "The single that introduced Coldplay to a worldwide audience." },
  { name: "Everlong", artist: "Foo Fighters", year: 1997, genre: "Rock", families: ["rock"], tags: ["guitar", "riff"], energy: 5, blurb: "A fan favorite from “The Colour and the Shape” driven by a fast, ringing guitar riff." },
  { name: "Don't Stop Believin'", artist: "Journey", year: 1981, genre: "Rock", families: ["rock"], tags: ["anthemic", "retro"], energy: 4, blurb: "The chorus that gives the song its name doesn't arrive until near the end." },
  { name: "Sweet Child o' Mine", artist: "Guns N' Roses", year: 1987, genre: "Rock", families: ["rock", "metal"], tags: ["riff", "guitar"], energy: 5, blurb: "Opens with one of rock's most recognizable guitar riffs." },
  { name: "Bohemian Rhapsody", artist: "Queen", year: 1975, genre: "Rock", families: ["rock"], tags: ["epic", "retro", "anthemic"], energy: 4, blurb: "A six-minute single that moves between ballad, opera and hard rock." },
  { name: "The Less I Know the Better", artist: "Tame Impala", year: 2015, genre: "Alternative", families: ["indie", "electronic"], tags: ["synth", "groove"], energy: 3, blurb: "A bass-driven, psychedelic groove from “Currents”." },
  { name: "Dog Days Are Over", artist: "Florence + The Machine", year: 2008, genre: "Alternative", families: ["indie", "pop"], tags: ["anthemic", "upbeat"], energy: 4, blurb: "A handclap-driven burst of energy from the debut album “Lungs”." },
  { name: "Pumped Up Kicks", artist: "Foster the People", year: 2011, genre: "Alternative", families: ["indie", "pop"], tags: ["upbeat", "synth"], energy: 3, blurb: "A breezy, catchy hook that hides much darker lyrics." },
  { name: "Ho Hey", artist: "The Lumineers", year: 2012, genre: "Alternative", families: ["folk", "indie"], tags: ["acoustic", "upbeat", "anthemic"], energy: 3, blurb: "A foot-stomping folk single built around handclaps and a shouted chorus." },

  // ---- Pop ----
  { name: "Blinding Lights", artist: "The Weeknd", year: 2019, genre: "Pop", families: ["pop", "electronic", "rnb"], tags: ["synth", "retro", "dance"], energy: 4, blurb: "An 80s-style synth-pop track that became one of the most-streamed songs of all time." },
  { name: "Levitating", artist: "Dua Lipa", year: 2020, genre: "Pop", families: ["pop", "electronic"], tags: ["disco", "dance", "retro"], energy: 4, blurb: "A disco-flavored dance-pop track from “Future Nostalgia”, an album built on retro grooves." },
  { name: "Shake It Off", artist: "Taylor Swift", year: 2014, genre: "Pop", families: ["pop"], tags: ["upbeat", "dance"], energy: 4, blurb: "The lead single from “1989”, the album where Taylor Swift went fully pop." },
  { name: "Good 4 U", artist: "Olivia Rodrigo", year: 2021, genre: "Pop", families: ["pop", "rock"], tags: ["punk", "guitar", "anthemic"], energy: 5, blurb: "A pop-punk burst from the debut album “SOUR” that wears its early-2000s influences proudly." },
  { name: "As It Was", artist: "Harry Styles", year: 2022, genre: "Pop", families: ["pop"], tags: ["synth", "upbeat"], energy: 4, blurb: "A bouncy synth-pop single from “Harry's House” whose upbeat sound covers a lonelier lyric." },
  { name: "Uptown Funk", artist: "Mark Ronson", year: 2014, genre: "Pop", families: ["pop", "rnb"], tags: ["funk", "dance", "party"], energy: 5, blurb: "A retro funk-pop party starter featuring Bruno Mars that spent many weeks at number one." },
  { name: "Rolling in the Deep", artist: "Adele", year: 2010, genre: "Pop", families: ["pop", "rnb"], tags: ["soul", "anthemic"], energy: 4, blurb: "A stomping, gospel-tinged breakup song from “21”." },
  { name: "bad guy", artist: "Billie Eilish", year: 2019, genre: "Pop", families: ["pop", "electronic"], tags: ["synth", "moody", "groove"], energy: 3, blurb: "Whispered vocals over a minimal bass line, from “When We All Fall Asleep, Where Do We Go?”." },
  { name: "Dancing Queen", artist: "ABBA", year: 1976, genre: "Pop", families: ["pop"], tags: ["disco", "dance", "retro"], energy: 4, blurb: "A shimmering disco-pop classic that became ABBA's signature song." },
  { name: "Billie Jean", artist: "Michael Jackson", year: 1982, genre: "Pop", families: ["pop", "rnb"], tags: ["groove", "funk", "retro"], energy: 4, blurb: "Its bass line and drum beat are among the most recognizable in pop, from “Thriller”." },
  { name: "Since U Been Gone", artist: "Kelly Clarkson", year: 2004, genre: "Pop", families: ["pop", "rock"], tags: ["guitar", "anthemic"], energy: 5, blurb: "A pop-rock breakup anthem from “Breakaway” with a huge, guitar-driven chorus." },
  { name: "Toxic", artist: "Britney Spears", year: 2003, genre: "Pop", families: ["pop", "electronic"], tags: ["dance", "synth"], energy: 4, blurb: "A dance-pop single built around a sharp, swirling string sample." },
  { name: "Dynamite", artist: "BTS", year: 2020, genre: "Pop", families: ["pop"], tags: ["disco", "upbeat", "dance"], energy: 4, blurb: "A bright, disco-inspired single that gave BTS their first number one on the Billboard Hot 100." },
  { name: "Happy", artist: "Pharrell Williams", year: 2013, genre: "Pop", families: ["pop", "rnb"], tags: ["upbeat", "soul", "groove"], energy: 4, blurb: "A feel-good soul-pop hit that became a worldwide sensation after appearing in “Despicable Me 2”." },
  { name: "Thinking Out Loud", artist: "Ed Sheeran", year: 2014, genre: "Pop", families: ["pop", "folk"], tags: ["acoustic", "mellow", "soul"], energy: 2, blurb: "A soulful acoustic love song from “x”." },

  // ---- Hip-hop ----
  { name: "Lose Yourself", artist: "Eminem", year: 2002, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["anthemic", "storytelling"], energy: 5, blurb: "Written for the film “8 Mile”, this track won the Academy Award for Best Original Song." },
  { name: "SICKO MODE", artist: "Travis Scott", year: 2018, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["trap", "epic"], energy: 5, blurb: "A multi-part epic from “Astroworld” with several beat switches that keeps changing direction." },
  { name: "HUMBLE.", artist: "Kendrick Lamar", year: 2017, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["groove"], energy: 4, blurb: "A stripped-down, piano-driven single from “DAMN.” that won the Grammy for Best Rap Song." },
  { name: "Empire State of Mind", artist: "JAY-Z", year: 2009, genre: "Hip-Hop/Rap", families: ["hiphop", "pop", "rnb"], tags: ["anthemic", "soul"], energy: 4, blurb: "A love letter to New York City, with Alicia Keys singing the chorus." },
  { name: "Gold Digger", artist: "Kanye West", year: 2005, genre: "Hip-Hop/Rap", families: ["hiphop", "rnb"], tags: ["soul", "groove"], energy: 4, blurb: "Built around a sample of Ray Charles' “I Got a Woman”, with Jamie Foxx on the hook." },
  { name: "Juicy", artist: "The Notorious B.I.G.", year: 1994, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["boom-bap", "storytelling"], energy: 3, blurb: "A rags-to-riches story from “Ready to Die” that became one of the defining hip-hop singles of the 90s." },
  { name: "In Da Club", artist: "50 Cent", year: 2003, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["party", "groove"], energy: 4, blurb: "The club-ready lead single from “Get Rich or Die Tryin'”." },
  { name: "Hey Ya!", artist: "Outkast", year: 2003, genre: "Hip-Hop/Rap", families: ["hiphop", "pop", "rnb"], tags: ["upbeat", "funk", "dance"], energy: 5, blurb: "A frantic, funk-flavored pop hit from “Speakerboxxx/The Love Below”." },
  { name: "God's Plan", artist: "Drake", year: 2018, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["mellow", "groove"], energy: 3, blurb: "A laid-back chart-topper that spent many weeks at number one in the US." },
  { name: "Rockstar", artist: "Post Malone", year: 2017, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["trap", "moody"], energy: 3, blurb: "A moody trap hit featuring 21 Savage." },
  { name: "Nuthin' but a 'G' Thang", artist: "Dr. Dre", year: 1992, genre: "Hip-Hop/Rap", families: ["hiphop"], tags: ["funk", "groove", "retro"], energy: 3, blurb: "A laid-back West Coast single from “The Chronic” featuring Snoop Dogg." },
  { name: "Can't Hold Us", artist: "Macklemore & Ryan Lewis", year: 2011, genre: "Hip-Hop/Rap", families: ["hiphop", "pop"], tags: ["upbeat", "anthemic"], energy: 5, blurb: "An energetic, piano-and-brass-driven anthem that became a sports-stadium staple." },

  // ---- R&B and soul ----
  { name: "Redbone", artist: "Childish Gambino", year: 2016, genre: "R&B/Soul", families: ["rnb"], tags: ["funk", "soul", "moody"], energy: 2, blurb: "A slinky, falsetto-led soul track from “Awaken, My Love!”." },
  { name: "Crazy in Love", artist: "Beyoncé", year: 2003, genre: "R&B/Soul", families: ["rnb", "pop", "hiphop"], tags: ["dance", "soul", "upbeat"], energy: 5, blurb: "Built on a blaring horn sample, this was Beyoncé's first solo number one." },
  { name: "No Scrubs", artist: "TLC", year: 1999, genre: "R&B/Soul", families: ["rnb"], tags: ["groove", "retro"], energy: 3, blurb: "A sharp, catchy kiss-off that topped the charts in the late 90s." },
  { name: "Ain't No Sunshine", artist: "Bill Withers", year: 1971, genre: "R&B/Soul", families: ["rnb", "folk"], tags: ["soul", "acoustic", "mellow"], energy: 2, blurb: "A spare, aching soul classic famous for its repeated “I know” refrain." },
  { name: "Superstition", artist: "Stevie Wonder", year: 1972, genre: "R&B/Soul", families: ["rnb"], tags: ["funk", "groove", "retro"], energy: 4, blurb: "Driven by a clavinet riff, this funk classic is one of Stevie Wonder's signature songs." },
  { name: "Say My Name", artist: "Destiny's Child", year: 1999, genre: "R&B/Soul", families: ["rnb", "pop"], tags: ["groove"], energy: 3, blurb: "A stuttering, rhythm-driven R&B hit from “The Writing's on the Wall”." },
  { name: "Best Part", artist: "Daniel Caesar", year: 2017, genre: "R&B/Soul", families: ["rnb"], tags: ["soul", "mellow", "acoustic"], energy: 2, blurb: "A hushed, guitar-led duet with H.E.R. from “Freudian”." },
  { name: "Leave the Door Open", artist: "Silk Sonic", year: 2021, genre: "R&B/Soul", families: ["rnb", "pop"], tags: ["soul", "retro", "groove"], energy: 3, blurb: "A velvety 70s-style soul single from Bruno Mars and Anderson .Paak." },

  // ---- Electronic and dance ----
  { name: "Get Lucky", artist: "Daft Punk", year: 2013, genre: "Dance", families: ["electronic", "pop", "rnb"], tags: ["disco", "funk", "groove"], energy: 4, blurb: "A disco-funk single with Nile Rodgers on guitar and Pharrell Williams on vocals." },
  { name: "One More Time", artist: "Daft Punk", year: 2000, genre: "Dance", families: ["electronic"], tags: ["dance", "retro", "upbeat"], energy: 5, blurb: "A joyful French house anthem with heavily processed vocals." },
  { name: "Titanium", artist: "David Guetta", year: 2011, genre: "Dance", families: ["electronic", "pop"], tags: ["dance", "anthemic"], energy: 4, blurb: "A dance-pop anthem featuring a soaring vocal from Sia." },
  { name: "Don't You Worry Child", artist: "Swedish House Mafia", year: 2012, genre: "Dance", families: ["electronic"], tags: ["dance", "anthemic"], energy: 5, blurb: "A big, emotional festival anthem and one of the group's biggest hits." },
  { name: "Strobe", artist: "deadmau5", year: 2009, genre: "Dance", families: ["electronic"], tags: ["synth", "mellow"], energy: 3, blurb: "A patient, ten-minute progressive-house build that became a fan favorite." },
  { name: "Midnight City", artist: "M83", year: 2011, genre: "Alternative", families: ["electronic", "indie"], tags: ["synth", "retro", "anthemic"], energy: 4, blurb: "A glowing synth anthem known for its saxophone solo at the end." },
  { name: "Sandstorm", artist: "Darude", year: 1999, genre: "Dance", families: ["electronic"], tags: ["dance", "upbeat"], energy: 5, blurb: "A relentless trance track that became a sports-arena and internet favorite." },
  { name: "Levels", artist: "Avicii", year: 2011, genre: "Dance", families: ["electronic", "pop"], tags: ["dance", "anthemic"], energy: 5, blurb: "A festival-sized anthem built on a soul vocal sample from Etta James." },

  // ---- Country ----
  { name: "Tennessee Whiskey", artist: "Chris Stapleton", year: 2015, genre: "Country", families: ["country"], tags: ["soul", "storytelling"], energy: 2, blurb: "Originally recorded by David Allan Coe, Stapleton's soulful version became his signature song." },
  { name: "Wagon Wheel", artist: "Darius Rucker", year: 2013, genre: "Country", families: ["country", "folk"], tags: ["acoustic", "upbeat", "storytelling"], energy: 3, blurb: "A cover of the Old Crow Medicine Show song, which grew out of a chorus Bob Dylan recorded in the 70s." },
  { name: "Before He Cheats", artist: "Carrie Underwood", year: 2005, genre: "Country", families: ["country", "pop"], tags: ["storytelling", "guitar", "anthemic"], energy: 4, blurb: "A revenge anthem that became one of the biggest country crossover hits of the 2000s." },
  { name: "Fast Car", artist: "Luke Combs", year: 2023, genre: "Country", families: ["country", "folk"], tags: ["acoustic", "storytelling", "cover"], energy: 3, blurb: "A faithful cover of Tracy Chapman's 1988 classic that brought the song back to the charts." },
  { name: "Body Like a Back Road", artist: "Sam Hunt", year: 2017, genre: "Country", families: ["country", "pop"], tags: ["groove", "mellow"], energy: 3, blurb: "A laid-back, pop-leaning country hit known for its talk-sung verses." },
  { name: "Cruise", artist: "Florida Georgia Line", year: 2012, genre: "Country", families: ["country", "pop"], tags: ["upbeat", "party"], energy: 4, blurb: "A breakout hit that mixed country lyrics with pop and hip-hop beats." },
  { name: "Jolene", artist: "Dolly Parton", year: 1973, genre: "Country", families: ["country", "folk"], tags: ["acoustic", "storytelling", "retro"], energy: 3, blurb: "A plea to a rival, written and recorded by Dolly Parton, and one of country's most-covered songs." },
  { name: "Friends in Low Places", artist: "Garth Brooks", year: 1990, genre: "Country", families: ["country"], tags: ["anthemic", "party", "storytelling"], energy: 4, blurb: "A sing-along barroom anthem that became Garth Brooks' signature song." },
  { name: "Chicken Fried", artist: "Zac Brown Band", year: 2008, genre: "Country", families: ["country"], tags: ["upbeat", "acoustic", "anthemic"], energy: 3, blurb: "A laid-back tribute to simple pleasures that became the band's breakout hit." },

  // ---- Folk and singer-songwriter ----
  { name: "Skinny Love", artist: "Bon Iver", year: 2008, genre: "Alternative", families: ["folk", "indie"], tags: ["acoustic", "mellow", "moody"], energy: 2, blurb: "Recorded in a Wisconsin cabin, this hushed breakup song launched Bon Iver." },
  { name: "Fast Car", artist: "Tracy Chapman", year: 1988, genre: "Singer/Songwriter", families: ["folk", "pop"], tags: ["acoustic", "storytelling", "mellow"], energy: 3, blurb: "A quiet story of escape that became Tracy Chapman's signature song." },
  { name: "Hallelujah", artist: "Jeff Buckley", year: 1994, genre: "Alternative", families: ["folk", "rock"], tags: ["mellow", "cover", "moody"], energy: 1, blurb: "A hushed, haunting cover of Leonard Cohen's song, from “Grace”." },
  { name: "Riptide", artist: "Vance Joy", year: 2013, genre: "Alternative", families: ["folk", "indie", "pop"], tags: ["acoustic", "upbeat"], energy: 3, blurb: "A bright, ukulele-driven hit with a chorus built to sing along." },
  { name: "Fire and Rain", artist: "James Taylor", year: 1970, genre: "Singer/Songwriter", families: ["folk"], tags: ["acoustic", "mellow", "retro", "storytelling"], energy: 2, blurb: "A confessional folk classic from “Sweet Baby James”." },
  { name: "Home", artist: "Edward Sharpe & The Magnetic Zeros", year: 2009, genre: "Alternative", families: ["folk", "indie"], tags: ["acoustic", "upbeat", "anthemic"], energy: 3, blurb: "A swaying call-and-response duet that became an indie-folk favorite." },

  // ---- Metal and hard rock ----
  { name: "Enter Sandman", artist: "Metallica", year: 1991, genre: "Metal", families: ["metal", "rock"], tags: ["riff", "epic"], energy: 5, blurb: "Built on one of metal's most recognizable riffs, from the band's self-titled “Black Album”." },
  { name: "Paranoid", artist: "Black Sabbath", year: 1970, genre: "Metal", families: ["metal", "rock"], tags: ["riff", "retro"], energy: 5, blurb: "A short, fast burst of riffs from the band often credited with inventing heavy metal." },
  { name: "Bring Me to Life", artist: "Evanescence", year: 2003, genre: "Rock", families: ["rock", "metal"], tags: ["anthemic", "moody"], energy: 5, blurb: "A gothic rock hit pairing soaring vocals with crunching guitars." },
  { name: "Numb", artist: "Linkin Park", year: 2003, genre: "Rock", families: ["rock", "hiphop"], tags: ["moody", "anthemic"], energy: 4, blurb: "A moody rap-rock single from “Meteora”." },

  // ---- Latin ----
  { name: "Despacito", artist: "Luis Fonsi", year: 2017, genre: "Latin", families: ["latin", "pop"], tags: ["dance", "groove"], energy: 4, blurb: "A reggaeton-pop smash featuring Daddy Yankee that became one of the most-streamed songs ever." },
  { name: "Gasolina", artist: "Daddy Yankee", year: 2004, genre: "Latin", families: ["latin", "hiphop"], tags: ["dance", "party"], energy: 5, blurb: "The reggaeton hit that helped introduce the genre to a worldwide audience." },
  { name: "Hips Don't Lie", artist: "Shakira", year: 2006, genre: "Latin", families: ["latin", "pop"], tags: ["dance", "groove"], energy: 4, blurb: "A horn-led pop hit featuring Wyclef Jean." },
  { name: "Bailando", artist: "Enrique Iglesias", year: 2014, genre: "Latin", families: ["latin", "pop"], tags: ["dance", "upbeat"], energy: 4, blurb: "A sunny, danceable Latin-pop hit and one of Enrique Iglesias' biggest songs." },
];
