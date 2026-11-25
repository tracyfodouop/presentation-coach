export type AnalyzedElement = {
  type: "text" | "rect";
  text: string;
  fontSize: number;
  fill: string;
};

export type AnalyzedSlide = {
  background: string | null;
  elements: AnalyzedElement[];
};

export type Tip = { level: "good" | "warning"; text: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function plural(list: number[]) {
  return `${list.length > 1 ? "diapositives" : "diapositive"} ${list.join(", ")}`;
}

export function analyzePresentation(slides: AnalyzedSlide[]) {
  const tips: Tip[] = [];
  let score = 100;

  const count = slides.length;
  if (count < 3) {
    score -= 10;
    tips.push({
      level: "warning",
      text: `Seulement ${count} diapositive${count > 1 ? "s" : ""} : visez au moins 3 pour structurer votre propos (introduction, contenu, conclusion).`,
    });
  } else if (count > 20) {
    score -= 10;
    tips.push({
      level: "warning",
      text: `${count} diapositives : au-delà de 20, le public décroche. Regroupez ou supprimez ce qui n'est pas essentiel.`,
    });
  } else {
    tips.push({ level: "good", text: `${count} diapositives : un volume adapté.` });
  }

  const empty: number[] = [];
  const dense: number[] = [];
  const small: number[] = [];
  const lowContrast: number[] = [];

  slides.forEach((slide, i) => {
    const n = i + 1;
    const texts = slide.elements.filter(
      (e) => e.type === "text" && e.text.trim() !== "",
    );

    if (slide.elements.length === 0) empty.push(n);

    const chars = texts.reduce((sum, e) => sum + e.text.length, 0);
    if (chars > 300) dense.push(n);

    if (texts.some((e) => e.fontSize < 40)) small.push(n);

    const bg = slide.background && HEX.test(slide.background) ? slide.background : "#ffffff";
    if (texts.some((e) => HEX.test(e.fill) && contrast(e.fill, bg) < 4.5)) {
      lowContrast.push(n);
    }
  });

  function rule(list: number[], perItem: number, cap: number, warning: string, good: string) {
    if (list.length > 0) {
      score -= Math.min(list.length * perItem, cap);
      tips.push({ level: "warning", text: `${warning} (${plural(list)}).` });
    } else {
      tips.push({ level: "good", text: good });
    }
  }

  rule(empty, 8, 24, "Des diapositives sont vides : complétez-les ou supprimez-les", "Aucune diapositive vide.");
  rule(dense, 6, 18, "Trop de texte : le public lit au lieu de vous écouter, gardez l'essentiel", "La quantité de texte par diapositive est raisonnable.");
  rule(small, 4, 12, "Texte trop petit pour être lu depuis le fond de la salle (visez 40 ou plus)", "Les tailles de texte sont lisibles.");
  rule(lowContrast, 6, 18, "Contraste insuffisant entre le texte et le fond : le texte est difficile à lire", "Le contraste texte/fond est bon.");

  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 85 ? "Excellent" : score >= 70 ? "Bien" : score >= 50 ? "À améliorer" : "À retravailler";

  return { score, label, tips };
}
