// import { pipeline } from "@xenova/transformers";

export type OCRProcessor = (imageFile: File | string) => Promise<string>;

export type OCRModel = {
  name: string;
  processor: () => Promise<OCRProcessor>;
};

type TesseractWorker = {
  setParameters: (parameters: {
    tessedit_char_whitelist: string;
  }) => Promise<void>;
  recognize: (image: File | string) => Promise<{ data: { text: string } }>;
};

type Tesseract = {
  createWorker: (
    lang?: string,
    workerCount?: number,
    options?: { langPath?: string }
  ) => Promise<TesseractWorker>;
};

declare global {
  // biome-ignore lint: Window is a built-in interface that needs augmentation
  interface Window {
    Tesseract?: Tesseract;
  }
}

function loadTesseractFromCDN(): Promise<Tesseract> {
  if (typeof window !== "undefined" && window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => {
      if (window.Tesseract) {
        resolve(window.Tesseract);
      } else {
        reject(new Error("Tesseract failed to load"));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load Tesseract"));
    };
    document.head.appendChild(script);
  });
}

async function createTesseractProcessor(): Promise<OCRProcessor> {
  const tesseractLib = await loadTesseractFromCDN();
  const { createWorker } = tesseractLib;

  const worker = await createWorker("eng", 1, {
    langPath: "https://tessdata.projectnaptha.com/4.0.0_best",
  });

  await worker.setParameters({
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.",
  });

  return async (imageFile: File | string): Promise<string> => {
    const {
      data: { text },
    } = await worker.recognize(imageFile);
    return text.trim();
  };
}

// async function createTrOCRProcessor(): Promise<OCRProcessor> {
//   const ocr = await pipeline("image-to-text", "Xenova/trocr-small-printed");

//   return async (imageFile: File | string): Promise<string> => {
//     let imageInput: string;

//     if (imageFile instanceof File) {
//       imageInput = URL.createObjectURL(imageFile);
//     } else {
//       imageInput = imageFile;
//     }

//     try {
//       const result = await ocr(imageInput);
//       const output = Array.isArray(result) ? result[0] : result;
//       if (typeof output === "string") {
//         return (output as string).trim();
//       }
//       if (output && typeof output === "object") {
//         let text = "";
//         if ("generated_text" in output) {
//           text = (output as { generated_text: string }).generated_text;
//         } else if ("text" in output) {
//           text = (output as { text: string }).text;
//         }
//         return text.trim();
//       }
//       return "";
//     } finally {
//       if (imageFile instanceof File && imageInput.startsWith("blob:")) {
//         URL.revokeObjectURL(imageInput);
//       }
//     }
//   };
// }

export const MODELS: OCRModel[] = [
  {
    name: "Tesseract (Fast, Low Accuracy)",
    processor: createTesseractProcessor,
  },
  //   {
  //     name: "TrOCR (Slow, High Accuracy)",
  //     processor: createTrOCRProcessor,
  //   },
];
