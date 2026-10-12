# ✨ Animated GitHub Profile Art

<p align="justify">A collection of animated SVG cards built with Python and automatically refreshed using GitHub Actions. It features live GitHub profile statistics, contribution visualizations, an animated 3D globe with cloud-region arcs, a rotating technology sphere, an isometric contribution skyline, a contribution heatmap, a snake contribution animation, and an animated ASCII portrait. The project uses custom SVG rendering scripts and a configurable theme to create a dynamic, personalized GitHub profile that updates automatically on a scheduled basis.</p>

## 📁 Project Structure

```text
.github/workflows/
└── Github-Profile-Art-Update.yml

Assets/Profile-Art/
├── data/             # Generated JSON statistics
├── scripts/          # Python scripts and requirements
├── svg/              # Generated SVG artwork
├── source-prepped.png
└── SETUP.md

README.md
```

## 🎨 Profile Art

```text
Assets/Profile-Art/
└── svg/                                                                        Update
    ├── header.svg              # Animated name and typing effect               12-hourly
    ├── info-card.svg           # Profile statistics and language bar           12-hourly
    ├── globe.svg               # Rotating 3D globe with cloud-region arcs      12-hourly
    ├── tech-sphere.svg         # Rotating technology stack                     12-hourly
    ├── contrib-skyline.svg     # Isometric contribution city                   12-hourly
    ├── contrib-heatmap.svg     # Contribution grid and streaks                 12-hourly
    ├── contrib-snake.svg       # Snake contribution animation                  12-hourly
    └── ascii-portrait.svg      # Animated ASCII photo portrait                 12-hourly
```

**Refresh:** Every 12 hours via GitHub Actions.

## Prerequisites

- **Requirements:** Python 3.11+, Git, and a GitHub account. Replace `YOUR_USERNAME` with your GitHub username in the examples below.
- **Profile repository:** GitHub displays the README of a repository named exactly after your username on your profile.
- **Create a repository:** Visit [GitHub → New Repository](https://github.com/new).
- **Repository settings:** Set the repository name to `YOUR_USERNAME`, choose **Public** visibility, and do not initialize it with a README, `.gitignore`, or license).

## ⚙️ Setup

**1. Clone the repository into a new folder**

```bash
git clone https://github.com/DIV297/DIV297.git YOUR_USERNAME # 1. Clone the existing project into your own folder
cd YOUR_USERNAME                                             # 2. Navigate into the cloned project
rm -rf .git                                                  # 3. Remove the original Git repository and its commit history
rm -f Assets/Profile-Art/data/*.json                         # 4. Remove generated profile data
rm -f Assets/Profile-Art/svg/*.svg                           # 5. Remove generated SVG artwork
rm -f Assets/Profile-Art/source-prepped.png                  # 6. Remove generated prepared portrait
git init -b main                                             # 7. Initialize a fresh Git repository on the main branch
```

**What this does:**

- **Clone:** Creates a local copy of the project.
- **Remove Git history:** Separates your copy from the original repository.
- **Remove generated files:** Clears existing output so your profile art can be regenerated using your own configuration and GitHub data.
- **Initialize Git:** Starts a new repository on the `main` branch, ready for your own commits and GitHub remote.

**Note:** Replace `YOUR_USERNAME` with your desired folder name. These commands use Bash-compatible syntax; `rm -f` removes matching files but leaves the folders and scripts intact. Review the paths before running the commands.

**2. Configure your profile**

Edit `Assets/Profile-Art/scripts/config.py`:

```python
USERNAME =    "YOUR_USERNAME"                      # must match your GitHub login
NAME =        "Your Name"
PROMPT_USER = "you"                                # shown as you@github
ROLES =       ["Backend Engineer", "Developer"]    # cycled by the typing animation
TAGLINE =     "City · what you build"              # neofetch rows; {placeholders} fill from live data
```
Also in `config.py`:

- `HOME` and `REGIONS`: the globe's pin and the cloud regions the arcs fly to, as `(name, lat, lon)`. </br>
- `TECH`: the labels on the tech sphere, grouped by category (each category gets its own colour). </br>
- Available placeholders in `INFO_ROWS`: `{uptime}`, `{top_langs}`, `{public_repos}`, `{stars}`, `{total}`, `{current_streak}`, `{longest_streak}`. </br>
- In `README.md`, replace `Digeshwar@github` in the three `<h3>` lines and the `alt` text with your own.

**3. Install Dependencies and Generate Profile Data and SVGs Locally (Optional)**

Create a Python virtual environment, install the required dependencies, fetch GitHub profile data, and generate the animated SVG artwork locally.

```bash
python -m venv .venv                 # 1. Create a Python virtual environment
.venv\Scripts\activate               # 2. Activate the environment in Windows
source .venv/bin/activate            # 3. Activate the environment in Linux/macOS
cd Assets/Profile-Art/scripts        # 4. Navigate to the scripts directory
pip install -r requirements.txt      # 5. Install the required dependencies

python fetch_contributions.py        # 6. Fetch GitHub contribution data   -> Output: ../data/contributions.json)
python fetch_profile.py              # 7. Fetch GitHub profile information -> Output: ../data/profile.json)
python render_all.py                 # 8. Generate the profile artwork     -> header, info-card, skyline, heatmap SVGs
cd ../..                             # 9. Return to the project root
```
The JSON files are saved in `Assets/Profile-Art/data/`, and the rendered SVGs are saved in `Assets/Profile-Art/svg/`. </br>
Open any generated `.svg` file from `Assets/Profile-Art/svg/` in Chrome to view its animation. </br>
**Note:** `contrib-snake.svg` is generated by the GitHub Actions workflow, not by `render_all.py`.
It may be missing locally until the workflow runs successfully.


## 🖼️ ASCII Portrait (Optional, local only)

```bash
pip install -r Assets/Profile-Art/scripts/requirements-portrait.txt
python Assets/Profile-Art/scripts/prep_photo.py                        # Uses your GitHub avatar by default
python Assets/Profile-Art/scripts/prep_photo.py  my-photo.jpg          # OR uses your my-photo.jpg
python Assets/Profile-Art/scripts/make_ascii_svg.py
```

Generated files:

- `Assets/Profile-Art/source-prepped.png`
- `Assets/Profile-Art/svg/ascii-portrait.svg`
- The portrait pipeline also runs in the configured GitHub Actions workflow.


The first run downloads a 5 MB background-removal model (`u2netp`).
For cleaner edges on a fast connection, use the 170 MB model: `REMBG_MODEL=u2net_human_seg python scripts/prep_photo.py`.
Best input: a front-facing photo with your head and shoulders and good light on your face.
To frame it differently, adjust `CROP` at the top of `make_ascii_svg.py`. `COLS` sets the level of detail.


## 🔄 GitHub Actions

```text
.github/
└── workflows/
    └── Github-Profile-Art-Update.yml
        ├── Schedule: Every 12 hours — 00:30 and 12:30 UTC
        ├── Manual: Run from the GitHub Actions tab
        └── Push: Changes to `main`, excluding configured generated paths
```

**Workflow tasks:** Fetch profile data → Render SVGs → Prepare portrait → Generate contribution snake → Commit generated files.<br/>
**Required permission:** `Settings → Actions → General → Workflow permissions → Read and write permissions`

## 🎛️ Customization

```text
Assets/Profile-Art/
└── scripts/
    ├── common.py                  # Colors and theme
    ├── config.py                  # Name, roles, profile details and tech stack
    ├── render_globe_svg.py        # Globe appearance
    ├── render_skyline_svg.py      # Skyline colors, height and angles
    ├── render_info_card.py        # Language bar and profile card
    └── make_ascii_svg.py          # Portrait crop and detail

.github/
└── workflows/
    └── Github-Profile-Art-Update.yml  # Refresh schedule and commit paths
```

_Python-generated SVGs use CSS/SMIL animations. GitHub's image caching may delay the display of updated artwork._


## Troubleshooting

```text
[Problem] No contribution cells found
Fix: GitHub may have changed its contribution calendar markup.
     Update the selectors in fetch_contributions.py.

[Problem] Workflow fails at the commit step
Fix: Enable Read and write permissions under:
     Settings → Actions → General → Workflow permissions (Step 7.1).

[Problem] Profile shows old images
Fix: GitHub may cache images for a few minutes.
     Hard-refresh the page or wait for the cache to update.

[Problem] Animation doesn't replay
Fix: Animations play when the profile page loads.
     Reload the profile to replay them.

[Problem] prep_photo.py hangs
Fix: The script may be downloading the model.
     Check your connection or pre-download u2netp.onnx into ~/.u2net/.

[Problem] Portrait looks flat
Fix: Use a brighter source photo or adjust the 0.8 gamma value
     in make_ascii_svg.py to improve contrast.
```
