import "./WorkspaceLayout.css";

import Workspace from "../pages/workspace/workspace";

function WorkspaceLayout({ onBackToHome }) {

    return (

        <div className="workspace-layout">

            <Workspace onBackToHome={onBackToHome} />

        </div>

    );

}

export default WorkspaceLayout;