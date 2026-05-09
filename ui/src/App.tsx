import { BrowserRouter, Routes, Route } from "react-router-dom";

import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Overview } from "./pages/Overview";
import { Budgeting } from "./pages/Budgeting";
import { QuickAdd } from "./pages/QuickAdd";
import { NotFound } from "./pages/404";

function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/overview" element={<Overview />} />
                    <Route path="/budgeting" element={<Budgeting />} />
                    <Route path="/quickadd" element={<QuickAdd />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default App