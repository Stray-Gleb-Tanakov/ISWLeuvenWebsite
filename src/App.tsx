import { BrowserRouter, Routes, Route, Router } from "react-router-dom";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Adult from "./pages/Adult";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Resources from "./pages/Resources";
import NotFound from "./pages/NotFound";
import Lokaal from "./pages/Lokaal";
import Catgirls from "./pages/Catgirls";
import Game from "./pages/Game";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/events" element={<Events />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/lokaal" element={<Lokaal />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/sponsor" element={<NotFound />} />
      <Route path="/adult" element={<Adult />} />
      <Route path="/catgirls" element={<Catgirls />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  </BrowserRouter>
);


export default App;
