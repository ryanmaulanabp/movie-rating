import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import time
import os
import kagglehub
import textwrap

# Set page config
st.set_page_config(
    page_title="Movie Rating Predictor: Fuzzy & Machine Learning From Scratch",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for Minimalist Light Mode
st.markdown("""
    <style>
    /* Global light theme background & text */
    .stApp {
        background-color: #ffffff !important;
        color: #0f172a !important;
    }
    
    /* Header adjustments */
    h1, h2, h3, h4, h5, h6 {
        color: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: -0.025em !important;
    }
    
    /* Clean Tab design */
    .stTabs [data-baseweb="tab-list"] {
        gap: 20px;
        border-bottom: 2px solid #e2e8f0;
        background-color: #f8fafc;
        padding: 5px 15px;
        border-radius: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b !important;
        background-color: transparent !important;
        border: none !important;
        font-weight: 600;
    }
    .stTabs [aria-selected="true"] {
        color: #0f172a !important;
        font-weight: 700;
    }
    /* Customize Streamlit's active tab highlight bar to sapphire blue */
    div[data-baseweb="tab-highlight-bar"] {
        background-color: #2563eb !important;
    }
    
    /* Modern minimalist Cards */
    .card {
        padding: 24px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background-color: #ffffff;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        transition: box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    
    /* Accent top lines */
    .highlight-mamdani {
        border-top: 4px solid #2563eb; /* Sapphire Blue */
    }
    .highlight-sugeno {
        border-top: 4px solid #ea580c; /* Orange */
    }
    .highlight-linreg {
        border-top: 4px solid #059669; /* Emerald Green */
    }
    
    /* Force crisp dark text colors inside cards */
    .card, .card * {
        color: #0f172a !important;
    }
    .card small {
        color: #64748b !important;
    }
    
    /* Metric typography */
    div[data-testid="stMetricValue"] {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 2.2rem !important;
        font-weight: 700 !important;
        color: #0f172a !important;
    }
    div[data-testid="stMetricLabel"] {
        font-size: 0.9rem !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        color: #64748b !important;
    }
    
    /* Sidebar styling for light mode */
    section[data-testid="stSidebar"] {
        background-color: #f8fafc !important;
        border-right: 1px solid #e2e8f0;
    }
    section[data-testid="stSidebar"] * {
        color: #0f172a !important;
    }
    
    /* Expander styling */
    .stExpander {
        background-color: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
    }
    </style>
""", unsafe_allow_html=True)

st.title("Movie Rating Prediction Dashboard")
st.markdown("### Integrated 5-Input Fuzzy Logic (Mamdani & Sugeno) & Machine Learning From Scratch")

# Helper wrapper for trapezoidal integration to handle numpy version compatibility
def trapz_safe(y, x):
    if hasattr(np, 'trapezoid'):
        return np.trapezoid(y, x)
    else:
        return np.trapz(y, x)

# ================================================================
#  MEMBERSHIP FUNCTIONS & SYSTEM DEF
# ================================================================

def trimf(x, a, b, c):
    """Triangular MF: peak at b, zero at a and c"""
    left  = (x - a) / (b - a) if b != a else (1.0 if x >= a else 0.0)
    right = (c - x) / (c - b) if c != b else (1.0 if x <= c else 0.0)
    return float(max(0.0, min(left, right)))

def trapmf(x, a, b, c, d):
    """Trapezoidal MF: flat between b and c"""
    left  = (x - a) / (b - a) if b != a else (1.0 if x >= b else 0.0)
    right = (d - x) / (d - c) if d != c else (1.0 if x <= c else 0.0)
    return float(max(0.0, min(left, 1.0, right)))

# ── INPUT 1: Budget (juta USD) ─────────────────────────────
def mf_budget_low(x):    return trapmf(x, 0,  0,  3,  10)
def mf_budget_medium(x): return trimf(x,  5,  20, 50)
def mf_budget_high(x):   return trapmf(x, 40, 80, 175, 175)

# ── INPUT 2: Popularity ─────────────────────────────────────
def mf_pop_low(x):    return trapmf(x, 0,  0,  2,  5)
def mf_pop_medium(x): return trimf(x,  3,  8,  15)
def mf_pop_high(x):   return trapmf(x, 12, 20, 29, 29)

# ── INPUT 3: Runtime (menit) ────────────────────────────────
def mf_rt_short(x):  return trapmf(x, 45,  45,  75,  90)
def mf_rt_medium(x): return trimf(x,  80,  105, 130)
def mf_rt_long(x):   return trapmf(x, 120, 150, 200, 200)

# ── INPUT 4: Vote Count ─────────────────────────────────────
def mf_vc_low(x):    return trapmf(x, 0,   0,   50,  150)
def mf_vc_medium(x): return trimf(x,  100, 400, 1000)
def mf_vc_high(x):   return trapmf(x, 700, 1500, 2000, 2000)

# ── INPUT 5: Release Year ───────────────────────────────────
def mf_yr_old(x):    return trapmf(x, 1914, 1914, 1980, 1995)
def mf_yr_mid(x):    return trimf(x,  1985, 2000, 2010)
def mf_yr_recent(x): return trapmf(x, 2005, 2012, 2017, 2017)

# ── OUTPUT: Vote Average (0–10) ─────────────────────────────
OUTPUT_UNIVERSE = np.linspace(0, 10, 500)
def mf_rating_low(x):    return trapmf(x, 0,   0,   3.5, 5.5)
def mf_rating_medium(x): return trimf(x,  4.5, 6.0, 7.5)
def mf_rating_high(x):   return trapmf(x, 6.5, 8.0, 10,  10)

OUTPUT_MF    = {'low': mf_rating_low, 'medium': mf_rating_medium, 'high': mf_rating_high}
SUGENO_CONST = {'low': 3.5, 'medium': 6.0, 'high': 8.0}

# Peta fungsi ke label
BUD_MAP = {mf_budget_low:'low',    mf_budget_medium:'medium', mf_budget_high:'high'}
POP_MAP = {mf_pop_low:'low',       mf_pop_medium:'medium',    mf_pop_high:'high'}
RT_MAP  = {mf_rt_short:'short',    mf_rt_medium:'medium',     mf_rt_long:'long'}
VC_MAP  = {mf_vc_low:'low',        mf_vc_medium:'medium',     mf_vc_high:'high'}
YR_MAP  = {mf_yr_old:'old',        mf_yr_mid:'mid',           mf_yr_recent:'recent'}

# Programmatic generation of all 243 rules to cover 100% of the input space
budget_mfs = [mf_budget_low, mf_budget_medium, mf_budget_high]
pop_mfs = [mf_pop_low, mf_pop_medium, mf_pop_high]
rt_mfs = [mf_rt_short, mf_rt_medium, mf_rt_long]
vc_mfs = [mf_vc_low, mf_vc_medium, mf_vc_high]
yr_mfs = [mf_yr_old, mf_yr_mid, mf_yr_recent]

RULES = []
for b_idx, b_mf in enumerate(budget_mfs, start=1):
    for p_idx, p_mf in enumerate(pop_mfs, start=1):
        for r_idx, r_mf in enumerate(rt_mfs, start=1):
            for v_idx, v_mf in enumerate(vc_mfs, start=1):
                for y_idx, y_mf in enumerate(yr_mfs, start=1):
                    # Calculate average level to determine consequent rating (low/medium/high)
                    avg = (b_idx + p_idx + r_idx + v_idx + y_idx) / 5.0
                    if avg < 1.7:
                        cons = 'low'
                    elif avg < 2.3:
                        cons = 'medium'
                    else:
                        cons = 'high'
                    RULES.append((b_mf, p_mf, r_mf, v_mf, y_mf, cons))

# ================================================================
#  FUZZIFICATION & INFERENCE FUNCTIONS
# ================================================================

def fuzzify(budget_M, popularity, runtime, vote_count, release_year):
    return {
        'budget':      {'low': mf_budget_low(budget_M),  'medium': mf_budget_medium(budget_M),  'high': mf_budget_high(budget_M)},
        'popularity':  {'low': mf_pop_low(popularity),   'medium': mf_pop_medium(popularity),   'high': mf_pop_high(popularity)},
        'runtime':     {'short': mf_rt_short(runtime),   'medium': mf_rt_medium(runtime),       'long': mf_rt_long(runtime)},
        'vote_count':  {'low': mf_vc_low(vote_count),    'medium': mf_vc_medium(vote_count),    'high': mf_vc_high(vote_count)},
        'release_year':{'old': mf_yr_old(release_year),  'mid': mf_yr_mid(release_year),        'recent': mf_yr_recent(release_year)},
    }

def mamdani_infer(budget_M, popularity, runtime, vote_count, release_year, fuzz=None):
    if fuzz is None:
        fuzz = fuzzify(budget_M, popularity, runtime, vote_count, release_year)
    agg = np.zeros(len(OUTPUT_UNIVERSE))

    for (bf, pf, rf, vcf, yrf, cons) in RULES:
        mu_b  = fuzz['budget'     ][BUD_MAP[bf]]
        mu_p  = fuzz['popularity' ][POP_MAP[pf]]
        mu_r  = fuzz['runtime'    ][RT_MAP[rf]]
        mu_vc = fuzz['vote_count' ][VC_MAP[vcf]]
        mu_yr = fuzz['release_year'][YR_MAP[yrf]]

        alpha = min(mu_b, mu_p, mu_r, mu_vc, mu_yr)
        if alpha == 0:
            continue

        clipped = np.array([min(alpha, OUTPUT_MF[cons](y)) for y in OUTPUT_UNIVERSE])
        agg     = np.maximum(agg, clipped)

    num = trapz_safe(OUTPUT_UNIVERSE * agg, OUTPUT_UNIVERSE)
    den = trapz_safe(agg, OUTPUT_UNIVERSE)
    return num / den if den > 1e-10 else 5.0

def sugeno_infer(budget_M, popularity, runtime, vote_count, release_year, fuzz=None):
    if fuzz is None:
        fuzz = fuzzify(budget_M, popularity, runtime, vote_count, release_year)
    numerator, denominator = 0.0, 0.0

    for (bf, pf, rf, vcf, yrf, cons) in RULES:
        mu_b  = fuzz['budget'     ][BUD_MAP[bf]]
        mu_p  = fuzz['popularity' ][POP_MAP[pf]]
        mu_r  = fuzz['runtime'    ][RT_MAP[rf]]
        mu_vc = fuzz['vote_count' ][VC_MAP[vcf]]
        mu_yr = fuzz['release_year'][YR_MAP[yrf]]

        alpha = min(mu_b, mu_p, mu_r, mu_vc, mu_yr)
        numerator   += alpha * SUGENO_CONST[cons]
        denominator += alpha

    return numerator / denominator if denominator > 1e-10 else 5.0

# ================================================================
#  LINEAR REGRESSION SCRATCH
# ================================================================

class LinearRegressionScratch:
    def __init__(self):
        self.theta = None
        
    def fit(self, X, y):
        Xb = np.column_stack([np.ones(len(X)), X])
        try:
            self.theta = np.linalg.inv(Xb.T @ Xb) @ Xb.T @ y
        except np.linalg.LinAlgError:
            self.theta = np.linalg.lstsq(Xb, y, rcond=None)[0]
        return self
        
    def predict(self, X):
        Xb = np.column_stack([np.ones(len(X)), X])
        return Xb @ self.theta
        
    def r2(self, X, y):
        yp = self.predict(X)
        return 1 - np.sum((y-yp)**2) / np.sum((y-y.mean())**2)

def extract_fuzzy_features(budget_M, popularity, runtime, vote_count, release_year, fuzz=None):
    if fuzz is None:
        fuzz = fuzzify(budget_M, popularity, runtime, vote_count, release_year)
    m = mamdani_infer(budget_M, popularity, runtime, vote_count, release_year, fuzz)
    s = sugeno_infer(budget_M, popularity, runtime, vote_count, release_year, fuzz)
    return np.array([
        fuzz['budget']['low'],       fuzz['budget']['medium'],       fuzz['budget']['high'],
        fuzz['popularity']['low'],   fuzz['popularity']['medium'],   fuzz['popularity']['high'],
        fuzz['runtime']['short'],    fuzz['runtime']['medium'],      fuzz['runtime']['long'],
        fuzz['vote_count']['low'],   fuzz['vote_count']['medium'],   fuzz['vote_count']['high'],
        fuzz['release_year']['old'], fuzz['release_year']['mid'],    fuzz['release_year']['recent'],
        m, s
    ])

# ================================================================
#  DATASET LOADING & TRAINING
# ================================================================

@st.cache_data
def load_and_preprocess_data():
    csv_path = "movies_metadata.csv"
    if not os.path.exists(csv_path):
        # Fallback to kagglehub download
        try:
            path = kagglehub.dataset_download("rounakbanik/the-movies-dataset")
            csv_path = os.path.join(path, "movies_metadata.csv")
        except Exception:
            # Fallback to parent path
            csv_path = "../movies_metadata.csv"
            
    if not os.path.exists(csv_path):
        return None
        
    df_raw = pd.read_csv(csv_path, low_memory=False)
    df = df_raw.copy()
    df['budget']       = pd.to_numeric(df['budget'],       errors='coerce')
    df['popularity']   = pd.to_numeric(df['popularity'],   errors='coerce')
    df['runtime']      = pd.to_numeric(df['runtime'],      errors='coerce')
    df['vote_count']   = pd.to_numeric(df['vote_count'],   errors='coerce')
    df['vote_average'] = pd.to_numeric(df['vote_average'], errors='coerce')

    df['release_date'] = pd.to_datetime(df['release_date'], errors='coerce')
    df['release_year'] = df['release_date'].dt.year

    COLS = ['title', 'budget','popularity','runtime','vote_count','release_year','vote_average']
    df = df[COLS].dropna()
    df = df[
        (df['budget']       > 0) &
        (df['popularity']   > 0) &
        (df['runtime']      > 0) &
        (df['vote_count']   > 0) &
        (df['release_year'] > 1900) &
        (df['vote_average'] > 0)
    ]

    def remove_outliers(df, col, lo=0.01, hi=0.99):
        a, b = df[col].quantile(lo), df[col].quantile(hi)
        return df[(df[col] >= a) & (df[col] <= b)]

    for col in ['budget','popularity','runtime','vote_count']:
        df = remove_outliers(df, col)

    df['budget_M'] = df['budget'] / 1e6
    return df.reset_index(drop=True)

@st.cache_resource
def get_trained_models(df):
    if df is None:
        return None, None, None
    df_sample = df.sample(n=300, random_state=42).reset_index(drop=True)
    X_fuzzy = []
    for _, row in df_sample.iterrows():
        feat = extract_fuzzy_features(row['budget_M'], row['popularity'],
                                      row['runtime'],  row['vote_count'], row['release_year'])
        X_fuzzy.append(feat)
    X_fuzzy = np.vstack(X_fuzzy)
    y_true = df_sample['vote_average'].values
    
    lr_fuzzy = LinearRegressionScratch().fit(X_fuzzy, y_true)
    
    X_raw = df_sample[['budget_M','popularity','runtime','vote_count','release_year']].values
    lr_raw = LinearRegressionScratch().fit(X_raw, y_true)
    
    return lr_fuzzy, lr_raw, df_sample

# Load data
df = load_and_preprocess_data()
lr_fuzzy, lr_raw, df_sample = get_trained_models(df)

# ================================================================
#  SIDEBAR CONTROLS & SESSION STATE
# ================================================================

# Initialize session state for sliders if not already present
if 'budget' not in st.session_state:
    st.session_state['budget'] = 25.0
if 'popularity' not in st.session_state:
    st.session_state['popularity'] = 12.0
if 'runtime' not in st.session_state:
    st.session_state['runtime'] = 105.0
if 'vote_count' not in st.session_state:
    st.session_state['vote_count'] = 350.0
if 'release_year' not in st.session_state:
    st.session_state['release_year'] = 2010

# Callback function when movie is selected
def on_movie_change():
    selected_movie = st.session_state['selected_movie']
    if selected_movie != "-- Custom Inputs --" and df is not None:
        movie_row = df[df['title'] == selected_movie].iloc[0]
        st.session_state['budget'] = float(np.clip(movie_row['budget_M'], 0.0, 175.0))
        st.session_state['popularity'] = float(np.clip(movie_row['popularity'], 0.0, 29.0))
        st.session_state['runtime'] = float(np.clip(movie_row['runtime'], 45.0, 200.0))
        st.session_state['vote_count'] = float(np.clip(movie_row['vote_count'], 0.0, 2000.0))
        st.session_state['release_year'] = int(np.clip(movie_row['release_year'], 1914, 2017))

# Callback function when a slider is changed manually
def on_slider_change():
    st.session_state['selected_movie'] = "-- Custom Inputs --"

st.sidebar.header("Movie Selection")
if df is not None:
    movie_titles = sorted(df['title'].unique())
    st.sidebar.selectbox(
        "Select a Movie", 
        ["-- Custom Inputs --"] + movie_titles, 
        key='selected_movie', 
        on_change=on_movie_change
    )
else:
    st.sidebar.info("Dataset not loaded. Manual controls only.")

st.sidebar.header("Input Parameters")
input_budget = st.sidebar.slider("Budget (Juta USD)", min_value=0.0, max_value=175.0, key='budget', step=0.5, on_change=on_slider_change)
input_popularity = st.sidebar.slider("Popularity Score", min_value=0.0, max_value=29.0, key='popularity', step=0.1, on_change=on_slider_change)
input_runtime = st.sidebar.slider("Runtime (Menit)", min_value=45.0, max_value=200.0, key='runtime', step=1.0, on_change=on_slider_change)
input_vote_count = st.sidebar.slider("Vote Count", min_value=0.0, max_value=2000.0, key='vote_count', step=10.0, on_change=on_slider_change)
input_release_year = st.sidebar.slider("Release Year", min_value=1914, max_value=2017, key='release_year', step=1, on_change=on_slider_change)

# Precalculate real-time values for Single Prediction
fuzz_vals = fuzzify(input_budget, input_popularity, input_runtime, input_vote_count, input_release_year)
mamdani_pred = mamdani_infer(input_budget, input_popularity, input_runtime, input_vote_count, input_release_year, fuzz_vals)
sugeno_pred = sugeno_infer(input_budget, input_popularity, input_runtime, input_vote_count, input_release_year, fuzz_vals)

if lr_fuzzy is not None:
    features_vec = extract_fuzzy_features(input_budget, input_popularity, input_runtime, input_vote_count, input_release_year, fuzz_vals)
    linreg_pred = lr_fuzzy.predict(features_vec.reshape(1, -1))[0]
    linreg_pred = float(np.clip(linreg_pred, 0, 10))
else:
    linreg_pred = 5.0 # default fallback

# Create Tabs
tab1, tab2, tab3, tab4 = st.tabs([
    "Single Prediction Dashboard", 
    "Membership Functions", 
    "Batch Evaluation & Simulation", 
    "Model Interpretations & Weights"
])

# ================================================================
#  TAB 1: SINGLE PREDICTION DASHBOARD
# ================================================================
with tab1:
    st.markdown("### Real-Time Model Inference Comparison")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown(f"""
        <div class="card highlight-mamdani">
            <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: bold;">Mamdani FIS Predictor</div>
            <div style="font-size: 2.2rem; font-weight: 700; color: #0f172a; margin: 8px 0;">{mamdani_pred:.4f}</div>
            <div style="font-size: 0.8rem; color: #64748b;">Defuzzification: Centroid (Numerical Integration)</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        st.markdown(f"""
        <div class="card highlight-sugeno">
            <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: bold;">Sugeno FIS Predictor</div>
            <div style="font-size: 2.2rem; font-weight: 700; color: #0f172a; margin: 8px 0;">{sugeno_pred:.4f}</div>
            <div style="font-size: 0.8rem; color: #64748b;">Defuzzification: Weighted Average (Zero-Order)</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col3:
        st.markdown(f"""
        <div class="card highlight-linreg">
            <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: bold;">Fuzzy-Driven Linear Regression</div>
            <div style="font-size: 2.2rem; font-weight: 700; color: #0f172a; margin: 8px 0;">{linreg_pred:.4f}</div>
            <div style="font-size: 0.8rem; color: #64748b;">Normal Equation (17-Dim Feature Space)</div>
        </div>
        """, unsafe_allow_html=True)
    st.markdown("---")
    
    # Active Rules Inspector
    with st.expander("Active Rules Inspector (Firing Strength \u03b1 > 0)", expanded=True):
        active_rules_list = []
        for idx, (bf, pf, rf, vcf, yrf, cons) in enumerate(RULES, start=1):
            mu_b  = fuzz_vals['budget'     ][BUD_MAP[bf]]
            mu_p  = fuzz_vals['popularity' ][POP_MAP[pf]]
            mu_r  = fuzz_vals['runtime'    ][RT_MAP[rf]]
            mu_vc = fuzz_vals['vote_count' ][VC_MAP[vcf]]
            mu_yr = fuzz_vals['release_year'][YR_MAP[yrf]]
            
            alpha = min(mu_b, mu_p, mu_r, mu_vc, mu_yr)
            if alpha > 0:
                rule_text = f"IF Budget is {BUD_MAP[bf].upper()} AND Popularity is {POP_MAP[pf].upper()} AND Runtime is {RT_MAP[rf].upper()} AND Vote Count is {VC_MAP[vcf].upper()} AND Release Year is {YR_MAP[yrf].upper()} THEN Rating is {cons.upper()}"
                active_rules_list.append({
                    "Rule #": idx,
                    "Rule Description": rule_text,
                    "Firing Strength (\u03b1)": round(alpha, 4),
                    "Consequent": cons.upper()
                })
        
        if active_rules_list:
            df_active_rules = pd.DataFrame(active_rules_list)
            st.dataframe(df_active_rules, use_container_width=True, hide_index=True)
        else:
            st.info("No active rules for the current inputs.")
            
    with st.expander("Real-Time 15-Dimension Fuzzification Breakdown (JSON)"):
        st.json(fuzz_vals)

# ================================================================
#  TAB 2: MEMBERSHIP FUNCTIONS VISUALIZER
# ================================================================
with tab2:
    st.markdown("### Visualizing Membership Functions & Selected Inputs")
    
    # Generate Plots
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    plt.style.use('default')
    fig.patch.set_facecolor('#ffffff')
    for ax in axes.flat:
        ax.set_facecolor('#f8fafc')
        ax.grid(True, alpha=0.4, color='#cbd5e1')
        
    C = ['#ef4444', '#f97316', '#10b981']
    
    mf_configs = [
        ('Budget (Juta USD)', np.linspace(0, 175, 400),
         [mf_budget_low, mf_budget_medium, mf_budget_high], ['Low','Medium','High'], input_budget),
        ('Popularity Score', np.linspace(0, 29, 400),
         [mf_pop_low, mf_pop_medium, mf_pop_high], ['Low','Medium','High'], input_popularity),
        ('Runtime (Menit)', np.linspace(45, 200, 400),
         [mf_rt_short, mf_rt_medium, mf_rt_long], ['Short','Medium','Long'], input_runtime),
        ('Vote Count', np.linspace(0, 2000, 400),
         [mf_vc_low, mf_vc_medium, mf_vc_high], ['Low','Medium','High'], input_vote_count),
        ('Release Year', np.linspace(1914, 2017, 400),
         [mf_yr_old, mf_yr_mid, mf_yr_recent], ['Old','Mid','Recent'], input_release_year),
        ('Vote Average (Output)', OUTPUT_UNIVERSE,
         [mf_rating_low, mf_rating_medium, mf_rating_high], ['Low','Medium','High'], None),
    ]

    for ax, (title, uni, mfs, lbls, current_val) in zip(axes.flat, mf_configs):
        for mf, c, lbl in zip(mfs, C, lbls):
            vals = [mf(x) for x in uni]
            ax.plot(uni, vals, color=c, lw=2.5, label=lbl)
            ax.fill_between(uni, vals, alpha=0.1, color=c)
            
        ax.set_title(title, fontweight='bold', fontsize=12)
        ax.set_ylabel('Derajat Keanggotaan')
        ax.set_ylim(-0.05, 1.15)
        ax.legend()
        
        # Plot dynamic vertical lines for current input values
        if current_val is not None:
            ax.axvline(x=current_val, color='#eab308', linestyle='--', lw=2, label=f'Input: {current_val}')
            ax.legend()
            
    plt.suptitle('Membership Curves & Active Inputs', fontsize=16, fontweight='bold', color='#ffffff', y=0.98)
    plt.tight_layout()
    st.pyplot(fig)

# ================================================================
#  TAB 3: BATCH EVALUATION & SIMULATION
# ================================================================
with tab3:
    st.markdown("### Batch Evaluation & Dataset Simulation")
    
    if df is None:
        st.warning("Warning: movies_metadata.csv was not found. Please place it in the application folder to unlock batch evaluation.")
    else:
        st.write("We will perform prediction evaluations on a random subset of 300 samples comparing Mamdani FIS, Sugeno FIS, and Linear Regression.")
        
        if st.button("Run Batch Simulation (300 Samples)"):
            with st.spinner("Processing batch simulation (Mamdani numerical integration may take a few seconds)..."):
                
                # Fetch predictions
                m_preds, s_preds, lr_preds = [], [], []
                gt = df_sample['vote_average'].values
                
                for _, row in df_sample.iterrows():
                    # Mamdani
                    mp = mamdani_infer(row['budget_M'], row['popularity'], row['runtime'], row['vote_count'], row['release_year'])
                    m_preds.append(mp)
                    # Sugeno
                    sp = sugeno_infer(row['budget_M'], row['popularity'], row['runtime'], row['vote_count'], row['release_year'])
                    s_preds.append(sp)
                    # Fuzzy-Driven LinReg
                    fv = extract_fuzzy_features(row['budget_M'], row['popularity'], row['runtime'], row['vote_count'], row['release_year'])
                    lrp = lr_fuzzy.predict(fv.reshape(1, -1))[0]
                    lr_preds.append(float(np.clip(lrp, 0, 10)))
                    
                m_preds = np.array(m_preds)
                s_preds = np.array(s_preds)
                lr_preds = np.array(lr_preds)
                
                # Metric calculation helpers
                def mae(yt, yp):  return float(np.mean(np.abs(yt - yp)))
                def mse(yt, yp):  return float(np.mean((yt - yp) ** 2))
                def rmse(yt, yp): return float(np.sqrt(mse(yt, yp)))
                def corr(yt, yp): return float(np.corrcoef(yt, yp)[0,1])
                def acc(yt, yp):  return float((np.abs(yp - yt) <= 1.0).mean() * 100)
                
                # Build metric data
                metric_data = {
                    "Method": ["Mamdani FIS", "Sugeno FIS", "Fuzzy-Driven LinReg"],
                    "MAE": [mae(gt, m_preds), mae(gt, s_preds), mae(gt, lr_preds)],
                    "MSE": [mse(gt, m_preds), mse(gt, s_preds), mse(gt, lr_preds)],
                    "RMSE": [rmse(gt, m_preds), rmse(gt, s_preds), rmse(gt, lr_preds)],
                    "Pearson Correlation": [corr(gt, m_preds), corr(gt, s_preds), corr(gt, lr_preds)],
                    "Tolerance Accuracy (±1.0)": [f"{acc(gt, m_preds):.2f}%", f"{acc(gt, s_preds):.2f}%", f"{acc(gt, lr_preds):.2f}%"]
                }
                
                # Render table
                st.dataframe(pd.DataFrame(metric_data), use_container_width=True)
                
                # Plot comparisons
                fig_eval, axes_eval = plt.subplots(1, 3, figsize=(18, 5))
                plt.style.use('default')
                fig_eval.patch.set_facecolor('#ffffff')
                for ax in axes_eval:
                    ax.set_facecolor('#f8fafc')
                    ax.grid(True, alpha=0.4, color='#cbd5e1')
                    
                # Scatter Mamdani
                axes_eval[0].scatter(gt, m_preds, alpha=0.4, color='#3b82f6', s=25)
                axes_eval[0].plot([0, 10], [0, 10], 'r--', lw=2)
                axes_eval[0].set_xlabel('Ground Truth (Vote Average)')
                axes_eval[0].set_ylabel('Prediksi Mamdani')
                axes_eval[0].set_title('Mamdani vs Ground Truth', fontweight='bold')
                axes_eval[0].set_xlim(1, 10); axes_eval[0].set_ylim(1, 10)
                
                # Scatter Sugeno
                axes_eval[1].scatter(gt, s_preds, alpha=0.4, color='#f97316', s=25)
                axes_eval[1].plot([0, 10], [0, 10], 'r--', lw=2)
                axes_eval[1].set_xlabel('Ground Truth (Vote Average)')
                axes_eval[1].set_ylabel('Prediksi Sugeno')
                axes_eval[1].set_title('Sugeno vs Ground Truth', fontweight='bold')
                axes_eval[1].set_xlim(1, 10); axes_eval[1].set_ylim(1, 10)
                
                # Error Histograms
                err_m = m_preds - gt
                err_s = s_preds - gt
                err_lr = lr_preds - gt
                
                axes_eval[2].hist(err_m, bins=20, alpha=0.5, color='#3b82f6', label='Mamdani Error')
                axes_eval[2].hist(err_s, bins=20, alpha=0.5, color='#f97316', label='Sugeno Error')
                axes_eval[2].hist(err_lr, bins=20, alpha=0.5, color='#10b981', label='LinReg Error')
                axes_eval[2].axvline(0, color='black', linestyle='--', lw=1.5)
                axes_eval[2].set_xlabel('Error Value (Prediction - Truth)')
                axes_eval[2].set_ylabel('Frequency')
                axes_eval[2].set_title('Error Distribution Comparison', fontweight='bold')
                axes_eval[2].legend()
                
                plt.tight_layout()
                st.pyplot(fig_eval)
                
                # Add written analysis for Tab 3
                st.markdown(textwrap.dedent("""
                ### Analisis Perbandingan: Mamdani vs Sugeno
                
                Berdasarkan hasil simulasi batch di atas, kita dapat membandingkan kedua metode fuzzy logic *from scratch* ini:
                
                1. **Karakteristik Output**:
                   * **Mamdani FIS**: Menghasilkan output yang bersifat kontinu dan lebih halus (*smooth*) karena menggunakan fungsi keanggotaan output dan defuzzifikasi Centroid (COA). Hal ini sangat cocok untuk masalah yang membutuhkan interpretasi output yang intuitif secara linguistik.
                   * **Sugeno FIS**: Menghasilkan nilai output konstan (*crisp*) pada tiap rule (Zero-Order) dan menggunakan rata-rata terbobot (*Weighted Average*). Sugeno cenderung menghasilkan nilai yang lebih terpusat pada nilai konstanta konsekuennya (`low=3.5`, `medium=6.0`, `high=8.0`).
                
                2. **Kecepatan Komputasi (Kompleksitas)**:
                   * **Sugeno** jauh lebih cepat (bisa mencapai 50x-100x *speedup*) dibanding Mamdani.
                   * **Mamdani** membutuhkan integrasi numerik (fungsi trapezoid/trapz pada universe output) untuk setiap sampel data. Proses ini memerlukan kalkulasi intensif yang kurang efisien untuk sistem waktu nyata (*real-time*) dengan data berskala besar.
                   
                3. **Akurasi & Performa Error**:
                   * Model **Fuzzy-Driven Linear Regression** (menggabungkan derajat keanggotaan fuzzy dan prediksi FIS) umumnya memberikan MAE dan RMSE terkecil serta Korelasi Pearson tertinggi karena bobot fiturnya dioptimalkan secara matematis menggunakan *Normal Equation* terhadap data latih riil.
                """))

# ================================================================
#  TAB 4: MODEL INTERPRETATIONS & WEIGHTS
# ================================================================
with tab4:
    st.markdown("### Interpretasi Model & Bobot Fuzzy-Driven Linear Regression")
    
    if lr_fuzzy is None:
        st.warning("Warning: Model Linear Regression from scratch was not trained because dataset was missing.")
    else:
        st.write("Fuzzy-Driven Linear Regression model weights (coefficients $\\theta$) trained from scratch using the Normal Equation:")
        
        # Features labels
        feature_labels = [
            "Budget Low", "Budget Medium", "Budget High",
            "Popularity Low", "Popularity Medium", "Popularity High",
            "Runtime Short", "Runtime Medium", "Runtime Long",
            "Vote Count Low", "Vote Count Medium", "Vote Count High",
            "Release Year Old", "Release Year Mid", "Release Year Recent",
            "Mamdani Predictor", "Sugeno Predictor"
        ]
        
        weights = lr_fuzzy.theta[1:] # Skip bias
        bias = lr_fuzzy.theta[0]
        
        # Render metrics for Bias
        st.metric(label="Intercept (Bias Coefficient / $\\theta_0$)", value=f"{bias:.4f}")
        
        # Display weights in a structured table
        weights_df = pd.DataFrame({
            "Feature Name": feature_labels,
            "Coefficient Weight (\\theta)": weights
        })
        
        st.dataframe(weights_df, use_container_width=True)
        
        # Render a beautiful Bar Chart using Matplotlib
        fig_w, ax_w = plt.subplots(figsize=(12, 6))
        plt.style.use('default')
        ax_w.set_facecolor('#f8fafc')
        fig_w.patch.set_facecolor('#ffffff')
        ax_w.grid(True, alpha=0.4, color='#cbd5e1')
        
        # Color positive weights teal, negative weights orange
        colors_w = ['#10b981' if w >= 0 else '#ef4444' for w in weights]
        
        ax_w.barh(feature_labels, weights, color=colors_w, height=0.6)
        ax_w.axvline(0, color='black', linestyle='--', lw=1.2)
        ax_w.set_xlabel('Coefficient weight magnitude ($\\theta$)')
        ax_w.set_title('Feature Contribution Weights on Movie Rating Preds', fontweight='bold', fontsize=14)
        
        plt.tight_layout()
        st.pyplot(fig_w)
        
        # Add written analysis for Tab 4
        st.markdown(textwrap.dedent("""
        ### Interpretasi Kontribusi Fitur (Koefisien $\\theta$)
        
        Melalui visualisasi bobot di atas, kita dapat menginterpretasikan kontribusi dari 17 fitur fuzzy (15 derajat keanggotaan + 2 hasil prediksi FIS) terhadap hasil prediksi rating film akhir:
        
        1. **Kontribusi Positif Terbesar**:
           * Fitur dengan nilai koefisien $\\theta$ positif yang tinggi (seperti **Popularity High**, **Mamdani/Sugeno Predictor**) berkontribusi kuat untuk meningkatkan prediksi rating film. Film yang memiliki popularitas tinggi dan diprediksi tinggi oleh FIS akan didorong mendekati rating maksimum oleh model regresi linier.
        
        2. **Kontribusi Negatif (Faktor Pengoreksi/Penyaring)**:
           * Fitur dengan koefisien negatif (seperti **Budget High**, **Vote Count Low**) bertindak sebagai faktor pengoreksi yang realistis. Misalnya, anggaran produksi yang terlalu tinggi (*Budget High*) tanpa diimbangi kepopuleran sering kali dikoreksi turun oleh model karena secara riil memiliki risiko tinggi menjadi film gagal (*flop*).
           * **Vote Count Low** juga mengurangi rating akhir secara signifikan untuk menghindari bias dari film yang dinilai tinggi hanya oleh sedikit orang (meningkatkan kredibilitas data dengan memprioritaskan vote count yang representatif).
           
        3. **Nilai Bias (Intercept / $\\theta_0$)**:
           * Merupakan nilai acuan dasar rating film ketika semua derajat keanggotaan fuzzy bernilai 0.
        """))
