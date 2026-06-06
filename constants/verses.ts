import { ScriptureVerse, ScriptureTopic } from "@/types";

type VerseSeed = Omit<ScriptureVerse, "id" | "created_at">;

export const SCRIPTURE_VERSES: VerseSeed[] = [
  // ── Prayer ──────────────────────────────────────────────────────────────
  { reference: "Philippians 4:6-7",   topic: "Prayer",   is_featured: true,  sort_order: 0,  verse_text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
  { reference: "James 5:16",          topic: "Prayer",   is_featured: true,  sort_order: 1,  verse_text: "Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much." },
  { reference: "Matthew 7:7",         topic: "Prayer",   is_featured: true,  sort_order: 2,  verse_text: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you." },
  { reference: "1 Thessalonians 5:17",topic: "Prayer",   is_featured: false, sort_order: 3,  verse_text: "Pray without ceasing." },
  { reference: "Matthew 21:22",       topic: "Prayer",   is_featured: false, sort_order: 4,  verse_text: "And all things, whatsoever ye shall ask in prayer, believing, ye shall receive." },
  { reference: "Luke 18:1",           topic: "Prayer",   is_featured: false, sort_order: 5,  verse_text: "And he spake a parable unto them to this end, that men ought always to pray, and not to faint." },
  { reference: "John 15:7",           topic: "Prayer",   is_featured: false, sort_order: 6,  verse_text: "If ye abide in me, and my words abide in you, ye shall ask what ye will, and it shall be done unto you." },
  { reference: "Jeremiah 33:3",       topic: "Prayer",   is_featured: true,  sort_order: 7,  verse_text: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not." },
  { reference: "1 John 5:14",         topic: "Prayer",   is_featured: false, sort_order: 8,  verse_text: "And this is the confidence that we have in him, that, if we ask any thing according to his will, he heareth us." },
  { reference: "Matthew 6:9-10",      topic: "Prayer",   is_featured: false, sort_order: 9,  verse_text: "After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name. Thy kingdom come. Thy will be done in earth, as it is in heaven." },

  // ── Faith ───────────────────────────────────────────────────────────────
  { reference: "Hebrews 11:1",        topic: "Faith",    is_featured: true,  sort_order: 0,  verse_text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
  { reference: "Romans 10:17",        topic: "Faith",    is_featured: true,  sort_order: 1,  verse_text: "So then faith cometh by hearing, and hearing by the word of God." },
  { reference: "Mark 11:24",          topic: "Faith",    is_featured: false, sort_order: 2,  verse_text: "Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them." },
  { reference: "2 Corinthians 5:7",   topic: "Faith",    is_featured: false, sort_order: 3,  verse_text: "For we walk by faith, not by sight." },
  { reference: "Romans 8:28",         topic: "Faith",    is_featured: true,  sort_order: 4,  verse_text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },

  // ── Healing ─────────────────────────────────────────────────────────────
  { reference: "Psalm 103:2-3",       topic: "Healing",  is_featured: true,  sort_order: 0,  verse_text: "Bless the LORD, O my soul, and forget not all his benefits: Who forgiveth all thine iniquities; who healeth all thy diseases." },
  { reference: "Isaiah 53:5",         topic: "Healing",  is_featured: true,  sort_order: 1,  verse_text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed." },
  { reference: "Jeremiah 17:14",      topic: "Healing",  is_featured: false, sort_order: 2,  verse_text: "Heal me, O LORD, and I shall be healed; save me, and I shall be saved: for thou art my praise." },
  { reference: "3 John 1:2",          topic: "Healing",  is_featured: false, sort_order: 3,  verse_text: "Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth." },
  { reference: "Psalm 147:3",         topic: "Healing",  is_featured: false, sort_order: 4,  verse_text: "He healeth the broken in heart, and bindeth up their wounds." },

  // ── Peace ───────────────────────────────────────────────────────────────
  { reference: "Isaiah 26:3",         topic: "Peace",    is_featured: true,  sort_order: 0,  verse_text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee." },
  { reference: "John 14:27",          topic: "Peace",    is_featured: true,  sort_order: 1,  verse_text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid." },
  { reference: "Psalm 46:10",         topic: "Peace",    is_featured: true,  sort_order: 2,  verse_text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth." },
  { reference: "Romans 15:13",        topic: "Peace",    is_featured: false, sort_order: 3,  verse_text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost." },

  // ── Guidance ────────────────────────────────────────────────────────────
  { reference: "Proverbs 3:5-6",      topic: "Guidance", is_featured: true,  sort_order: 0,  verse_text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths." },
  { reference: "Psalm 32:8",          topic: "Guidance", is_featured: true,  sort_order: 1,  verse_text: "I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye." },
  { reference: "Isaiah 30:21",        topic: "Guidance", is_featured: false, sort_order: 2,  verse_text: "And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it, when ye turn to the right hand, and when ye turn to the left." },
  { reference: "James 1:5",           topic: "Guidance", is_featured: false, sort_order: 3,  verse_text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him." },

  // ── Trust ───────────────────────────────────────────────────────────────
  { reference: "Psalm 37:5",          topic: "Trust",    is_featured: true,  sort_order: 0,  verse_text: "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass." },
  { reference: "Psalm 56:3",          topic: "Trust",    is_featured: false, sort_order: 1,  verse_text: "What time I am afraid, I will trust in thee." },
  { reference: "Isaiah 41:10",        topic: "Trust",    is_featured: true,  sort_order: 2,  verse_text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness." },
  { reference: "Nahum 1:7",           topic: "Trust",    is_featured: false, sort_order: 3,  verse_text: "The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him." },

  // ── Praise ──────────────────────────────────────────────────────────────
  { reference: "Psalm 150:6",         topic: "Praise",   is_featured: true,  sort_order: 0,  verse_text: "Let every thing that hath breath praise the LORD. Praise ye the LORD." },
  { reference: "Psalm 34:1",          topic: "Praise",   is_featured: true,  sort_order: 1,  verse_text: "I will bless the LORD at all times: his praise shall continually be in my mouth." },
  { reference: "Hebrews 13:15",       topic: "Praise",   is_featured: false, sort_order: 2,  verse_text: "By him therefore let us offer the sacrifice of praise to God continually, that is, the fruit of our lips giving thanks to his name." },

  // ── Warfare ─────────────────────────────────────────────────────────────
  { reference: "Ephesians 6:12",      topic: "Warfare",  is_featured: true,  sort_order: 0,  verse_text: "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places." },
  { reference: "2 Corinthians 10:4",  topic: "Warfare",  is_featured: true,  sort_order: 1,  verse_text: "For the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds." },
  { reference: "Isaiah 54:17",        topic: "Warfare",  is_featured: false, sort_order: 2,  verse_text: "No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn. This is the heritage of the servants of the LORD." },
  { reference: "Romans 8:37",         topic: "Warfare",  is_featured: false, sort_order: 3,  verse_text: "Nay, in all these things we are more than conquerors through him that loved us." },

  // ── Salvation ───────────────────────────────────────────────────────────
  { reference: "John 3:16",           topic: "Salvation",is_featured: true,  sort_order: 0,  verse_text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { reference: "Romans 10:9",         topic: "Salvation",is_featured: true,  sort_order: 1,  verse_text: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved." },
  { reference: "Acts 4:12",           topic: "Salvation",is_featured: false, sort_order: 2,  verse_text: "Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved." },

  // ── Hope ────────────────────────────────────────────────────────────────
  { reference: "Jeremiah 29:11",      topic: "Hope",     is_featured: true,  sort_order: 0,  verse_text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end." },
  { reference: "Romans 15:4",         topic: "Hope",     is_featured: false, sort_order: 1,  verse_text: "For whatsoever things were written aforetime were written for our learning, that we through patience and comfort of the scriptures might have hope." },
  { reference: "Lamentations 3:22-23",topic: "Hope",     is_featured: true,  sort_order: 2,  verse_text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness." },
];

export const FEATURED_VERSES = SCRIPTURE_VERSES.filter((v) => v.is_featured);

export const VERSE_TOPICS: ScriptureTopic[] = [
  "Prayer", "Faith", "Healing", "Peace", "Guidance",
  "Trust", "Praise", "Warfare", "Salvation", "Hope",
];
