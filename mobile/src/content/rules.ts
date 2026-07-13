export const RULES_TITLE = "Official Rules (Tennis Ball Edition)";

export const RULES_OBJECTIVE =
  "Hit the designated target/pin in the fewest strokes possible.";

export interface RuleSection {
  title: string;
  items: string[];
}

export const RULE_SECTIONS: RuleSection[] = [
  {
    title: "Scoring & Strokes",
    items: [
      "Standard stroke count. Every swing/hit at the ball counts as one stroke, including whiffs (an intentional swing that misses the ball still counts).",
      "Honors system. After each hole, the player with the lowest score on the previous hole tees off first on the next hole. On the first hole, decide order by coin flip, rochambeau, or agreement.",
      "Farthest-from-target plays next. During a hole, whoever's ball is farthest from the target always plays next (keeps things moving and avoids arguing over turns).",
      "Holed = done. A hole ends when the ball strikes the designated target/pin (or comes to rest touching it, if a \"resting\" target is used). Record your total strokes for that hole immediately.",
    ],
  },
  {
    title: "Hazards & Penalties",
    items: [
      "Concrete/pavement hazard. Any ball that comes to rest on concrete, asphalt, or other paved surface is a hazard. Move the ball straight backward (away from the target) to the nearest playable grass area and add 1 penalty stroke.",
      "Bridge/water carry option. On holes requiring a carry over a bridge, ditch, or water feature, a player may decline the carry and instead drop on the near side, walk around, and place the ball on the far side of the hazard, adding 2 penalty strokes.",
      "Woods, weeds, bushes, and flowerbeds. A ball landing in woods, tall weeds, bushes, or planted flowerbeds may be moved to a one club-length drop directly behind the obstruction (on the side away from the target), adding 1 penalty stroke. \"Behind\" means on the golfer's side of the obstacle relative to the target, not to the side.",
      "Lost ball. If a ball cannot be found within 2 minutes of searching, the player drops a new ball at the last known spot (or nearest grass area) with a 1 stroke penalty, same as a hazard.",
      "Out of bounds (OOB). Any area marked or agreed upon beforehand as out of bounds (parking lots, building interiors, roads, private gardens) works like the concrete rule: return to the nearest legal grass spot with a 1 stroke penalty.",
      "Stuck ball. If a ball comes to rest somewhere unplayable or unsafe to reach (storm drain, tree branch, roof, dense thicket), treat it as lost ball: drop at nearest safe grass spot with a 1 stroke penalty.",
    ],
  },
  {
    title: "Fair Play & Technique",
    items: [
      "No carrying, scooping, or tossing. The ball must be struck with a genuine swing. Placing, dropping, or lobbing the ball by hand (except for approved penalty drops) is not allowed.",
      "No moving the ball by foot or object other than the specific penalty relief described above.",
      "Play it as it lies unless a rule above explicitly grants relief.",
      "One mulligan per player, per round. A mulligan may be used on any single stroke (not retroactively after seeing where subsequent shots land) and does not count against the stroke total. Announce it when you take it.",
    ],
  },
  {
    title: "Conduct & Safety",
    items: [
      "Protect the environment. Do not strike, damage, or disturb plants, trees, wildlife, or campus/park property. Any player who does so risks disqualification from the round.",
      "Yield to pedestrians, cyclists, and vehicles. Never hit toward people, animals, or moving traffic. Wait until the area is clear.",
      "\"Fore\" rule. If a shot could travel toward another person, shout \"fore\" as a warning before or immediately after contact.",
      "Respect private property. Never enter fenced, posted, or clearly private areas to retrieve a ball — treat it as lost instead.",
    ],
  },
  {
    title: "Course Setup",
    items: [
      "Agree on holes beforehand. Before the round, the group should walk (or describe) each hole and agree on: the tee-off point, the target/pin, hazard boundaries (concrete, water/bridge, flowerbeds), and any local rules (e.g., \"that fountain is water,\" \"that hedge is out of bounds\").",
      "Par assignment (optional). Assign a par value to each hole based on estimated difficulty/distance, so players can track over/under par in addition to raw strokes.",
    ],
  },
  {
    title: "Ties & Etiquette",
    items: [
      "Ties. If the round ends tied, play a sudden-death playoff hole (or the final hole again) to determine the winner.",
      "Ready golf on tee shots only. Tee shots go in honors order; once balls are in play, follow the \"farthest from target plays next\" rule for pace of play.",
      "No do-overs beyond the mulligan. Once a stroke is taken and the ball's resting spot is confirmed, that result stands — with the sole exception of the single mulligan.",
      "Disputes. If players disagree on a ruling mid-round, default to the most conservative interpretation (the one that costs the striking player the penalty) and move on — don't let it stall the round.",
    ],
  },
];
