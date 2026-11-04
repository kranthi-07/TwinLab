import "./HomepageLayout.css";

import Sidebar from "../components/sidebar/sidebar";
import Topbar from "../components/topbar/topbar";
import Dashboard from "../pages/dashboard/dashboard";

function HomepageLayout({ onOpenWorkspace }) {

    return (

        <div className="layout">

            <Topbar onOpenWorkspace={onOpenWorkspace} />

            <div className="body">

                <Sidebar onOpenWorkspace={onOpenWorkspace} />

                <main className="page">

                    <Dashboard onOpenWorkspace={onOpenWorkspace} />

                </main>

            </div>

        </div>

    );

}

export default HomepageLayout;
