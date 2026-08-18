export interface RankingInfo {
  id: string
  name: string
  subtitle: string
  badgeSrc: string
  glowClass: string
  requirements: string
  benefits: string
  description: string
}

export class Ranking {
  public static readonly ALL: readonly RankingInfo[] = [
    {
      id: "warrior",
      name: "Warrior",
      subtitle: "Initial MVP",
      badgeSrc: "/Ranking/warrior.png",
      glowClass: "rank-glow-warrior",
      requirements: "Initial 2-week MVP, ≥ 3 contributors, base documentation",
      benefits: "Highlighted on /Projects feed",
      description: "Initial MVP foundation created by a motivated small squad.",
    },
    {
      id: "elite",
      name: "Elite",
      subtitle: "Active Dev",
      badgeSrc: "/Ranking/elite.png",
      glowClass: "rank-glow-elite",
      requirements: "≥ 15 merged PRs, ≥ 6 active contributors, 0 stale PRs (>7 days)",
      benefits: "Custom status badge & Discord channel",
      description: "Active development phase with steady PR velocity.",
    },
    {
      id: "master",
      name: "Master",
      subtitle: "Production Ready",
      badgeSrc: "/Ranking/master.png",
      glowClass: "rank-glow-master",
      requirements: "≥ 40 merged PRs, ≥ 10 contributors, Passing CI/CD pipeline",
      benefits: "Featured on /Home platform banner",
      description: "Production-ready codebase with robust automated CI/CD.",
    },
    {
      id: "grandmaster",
      name: "Grand Master",
      subtitle: "Batch Benchmark",
      badgeSrc: "/Ranking/grandmaster.png",
      glowClass: "rank-glow-grandmaster",
      requirements: "≥ 80 merged PRs, fully self-sustaining rotation, industry adoption",
      benefits: "Batch benchmark project for showcases",
      description: "Industry-grade platform with self-sustaining rotation.",
    },
    {
      id: "epic",
      name: "Epic",
      subtitle: "Ecosystem Scale",
      badgeSrc: "/Ranking/epic.png",
      glowClass: "rank-glow-epic",
      requirements: "≥ 150 merged PRs, multi-team ecosystem, automated test suite",
      benefits: "Dedicated showcase section & sponsor priority",
      description: "Ecosystem-scale project supporting multiple sub-modules.",
    },
    {
      id: "legend",
      name: "Legend",
      subtitle: "Cross-Batch Icon",
      badgeSrc: "/Ranking/legend.png",
      glowClass: "rank-glow-legend",
      requirements: "≥ 300 merged PRs, cross-batch adoption, continuous release cycle",
      benefits: "Hall of Fame highlight & industry partner exposure",
      description: "Cross-batch icon with continuous release engineering.",
    },
    {
      id: "mythic",
      name: "Mythic",
      subtitle: "Flagship Solution",
      badgeSrc: "/Ranking/mythic.png",
      glowClass: "rank-glow-mythic",
      requirements: "≥ 500 merged PRs, real-world deployment, flagship open-source project",
      benefits: "Global OpenCircle banner & permanent legendary status",
      description: "Flagship open-source solution deployed in production.",
    },
    {
      id: "mythical-glory",
      name: "Mythical Glory",
      subtitle: "Hall of Fame Legacy",
      badgeSrc: "/Ranking/mythicalglory.png",
      glowClass: "rank-glow-mythicalglory",
      requirements: "≥ 1000 merged PRs, multi-university adoption, industry standard benchmark",
      benefits: "Ultimate Hall of Fame status & permanent OpenCircle Legacy Award",
      description: "The pinnacle tier reserved for landmark software projects.",
    },
  ]

  public static getByName(name: string): RankingInfo | undefined {
    const normalized = name.toLowerCase().replace(/\s+/g, "")
    return Ranking.ALL.find(
      (r) => r.name.toLowerCase().replace(/\s+/g, "") === normalized || r.id.replace(/-/g, "") === normalized
    )
  }

  public static getBadgeSrc(name: string): string {
    const found = Ranking.getByName(name)
    return found ? found.badgeSrc : "/Ranking/warrior.png"
  }

  public static getGlowClass(name: string): string {
    const found = Ranking.getByName(name)
    return found ? found.glowClass : "rank-glow-warrior"
  }
}
