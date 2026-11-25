"use client";

export default function DeleteButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm("Supprimer cette présentation et toutes ses diapositives ?")) {
          e.preventDefault();
        }
      }}
      className="rounded border border-gray-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
    >
      Supprimer
    </button>
  );
}
