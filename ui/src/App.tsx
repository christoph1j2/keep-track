import { BrowserRouter, Routes, Route } from "react-router-dom";

import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Overview } from "./pages/Overview";
import { Budgeting } from "./pages/Budgeting";
import { QuickAdd } from "./pages/QuickAdd";
import { NotFound } from "./pages/404";
import { Categories } from "./pages/Categories";

/**
 * Root application component that wires routing into the shared layout shell.
 */
function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/overview" element={<Overview />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/budgeting" element={<Budgeting />} />
                    <Route path="/quickadd" element={<QuickAdd />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default App