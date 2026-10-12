"""Everything personal lives here. Edit this file, re-run `python scripts/render_all.py`."""

USERNAME = "G1thub-05"
NAME = "Digeshwar"
PROMPT_USER = "Digeshwar"
PROMPT_HOST = "github"

# Cycled by the typing animation in header.svg
ROLES = [
    "Full-Stack Developer | Java & Spring Boot",
    "Building Scalable Web Applications & REST APIs",
    "Frontend + Backend + Database Development",
    "Exploring Cloud, Microservices & Distributed Systems",
]

TAGLINE = "Raipur, IN  ·  Building Full-stack applications with Java, Spring Boot & Modern Frontend"

# neofetch-style rows on info-card.svg. "{...}" placeholders are filled from live data.
INFO_ROWS = [
    ("Role", "Full-Stack Developer"),
    ("Uptime", "{uptime} on GitHub"),
    ("Location", "India"),
    ("Focus", "Frontend · Backend · REST APIs"),
    ("Frontend", "React · JavaScript · TypeScript"),
    ("Backend", "Java · Spring Boot · Node.js"),
    ("Database", "SQL · NoSQL"),
    ("Langs", "{top_langs}"),
    ("Tools", "Git · GitHub · Docker · Maven"),
    ("Architecture", "REST APIs · WebSocket · Distributed Systems"),
    ("Repos", "{public_repos} public  ·  {stars} stars"),
    ("Activity", "{total} contributions this year"),
    ("Streak", "{current_streak}d current  ·  {longest_streak}d best"),
]


# globe.svg: home pin + arcs to the cloud regions you ship to (lat, lon)
HOME = ("Raipur, Chhattisgarh", 21.25, 81.63)
REGIONS = [
    ("ap-south-1", 19.08, 72.88),
    ("ap-southeast-1", 1.35, 103.82),
    ("eu-central-1", 50.11, 8.68),
    ("us-east-1", 38.95, -77.45),
    ("asia-northeast1", 35.68, 139.69),
]

# tech-sphere.svg: category -> labels (each category gets its own colour)
TECH = {
    "languages": ["Java", "JavaScript", "TypeScript", "HTML5", "CSS3",],
    "frontend": ["React", "Next.js", "Angular", "Bootstrap", "Tailwind CSS", "Figma",],
    "backend": ["Spring Boot", "Spring Security", "Node.js", "Express.js", "REST API", "Microservices", "JPA", "JWT", "OAuth2", "Swagger", "OpenAPI",],
    "databases": [ "Oracle", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",],
    "messaging": ["RabbitMQ", "Apache Kafka",],
    "cloud_devops": ["AWS", "Firebase", "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "GitHub Actions", "Jenkins", "Linux",],
    "monitoring": ["Prometheus", "Grafana", "Kibana", "Logstash",],
    "testing_quality": ["JUnit", "Apache JMeter", "SonarQube",],
    "tools": ["IntelliJ IDEA", "Eclipse", "Visual Studio Code", "Jira", "Apache Maven", "Apache Tomcat",],
}