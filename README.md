# Hybrid Movie Rating Predictor: Fuzzy Logic, Machine Learning & Deep Learning from Scratch

Aplikasi web dashboard interaktif berbasis **Streamlit** untuk memprediksi rating film (`vote_average`) menggunakan pendekatan sistem hibrida: **Fuzzy Logic (Mamdani & Sugeno)**, **Machine Learning (Linear Regression, Random Forest, SVR)**, dan **Deep Learning (Multi-Layer Perceptron)** dari nol (*from scratch*).

Proyek ini menggunakan dataset riil **TMDb Movie Dataset** dengan 5 variabel input:
1.  **Budget** (Anggaran Produksi)
2.  **Popularity** (Skor Popularitas TMDb)
3.  **Runtime** (Durasi Film)
4.  **Vote Count** (Jumlah Evaluator Rating)
5.  **Release Year** (Tahun Rilis Film)

---

## 🚀 Fitur Utama

- **Fuzzy Inference System (FIS) From Scratch**:
  - **Mamdani FIS**: Menggunakan defuzzifikasi *Centroid* (integrasi numerik trapezoid).
  - **Sugeno FIS**: Menggunakan defuzzifikasi *Weighted Average* (Zero-Order).
  - **243 Aturan Fuzzy (Full Space Coverage)**: Memastikan cakupan 100% dari input space sehingga tidak ada gap perhitungan (tidak ada error zero-firing).
- **Fuzzy-Driven Machine Learning**:
  - **Linear Regression from Scratch**: Dilatih menggunakan *Normal Equation* terhadap 17 fitur fuzzy (15 derajat keanggotaan + 2 luaran FIS).
  - **Random Forest & SVR**: Integrasi dengan library `scikit-learn` untuk perbandingan performa.
- **Fuzzy-Driven Deep Learning from Scratch**:
  - Jaringan saraf tiruan **Multi-Layer Perceptron (MLP)** dengan struktur *17 inputs → 32 hidden (ReLU) → 16 hidden (ReLU) → 1 output (Linear)* dibangun murni menggunakan `numpy` (termasuk modul *forward propagation*, *backpropagation*, dan optimasi *SGD*).
- **Interactive Streamlit Web Dashboard (Minimalist Light Mode)**:
  - **Movie Selector**: Pilihan film riil dari dataset untuk pengisian nilai slider secara dinamis.
  - **Active Rules Inspector**: Menampilkan aturan fuzzy yang aktif beserta kekuatan penembakannya (*firing strength* $\alpha > 0$) secara real-time.
  - **Batch Evaluation & Simulation**: Pengujian simulasi acak 300 sampel dengan perbandingan performa MAE, MSE, RMSE, Korelasi Pearson, akurasi toleransi, dan histogram error.
  - **DL Loss & Interpretability Visualizations**: Plot kurva pelatihan *loss history* MLP dari nol bersandingan dengan bobot fitur regresi.

---

## 📁 Struktur Direktori

```text
├── Web Streamlit DKA/
│   ├── app.py             # Versi awal (Fuzzy & Linear Regression saja)
│   ├── appv2.py           # Versi lengkap (Fuzzy, ML (RF, SVR), & Deep Learning MLP)
├── requirements.txt       # Daftar pustaka dependensi proyek
├── README.md
```

---

## 💻 Cara Akses Project

```bash
https://ryanmaulanabp-movie-rating-webstreamlitdkaapp-gvu3sj.streamlit.app/
```
