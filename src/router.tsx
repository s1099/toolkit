import { Route, Routes } from "react-router";
import { AppLayout } from "./layouts/app-layout";
import {
  AudioTranscribe,
  AudioTts,
  Home,
  ImageOcr,
  ImageRemoveBg,
  ImageUpscale,
  TextSummarize,
} from "./pages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="image">
          <Route path="ocr" element={<ImageOcr />} />
          <Route path="remove-bg" element={<ImageRemoveBg />} />
          <Route path="upscale" element={<ImageUpscale />} />
        </Route>
        <Route path="audio">
          <Route path="transcribe" element={<AudioTranscribe />} />
          <Route path="tts" element={<AudioTts />} />
        </Route>
        <Route path="text">
          <Route path="summarize" element={<TextSummarize />} />
        </Route>
      </Route>
    </Routes>
  );
}
