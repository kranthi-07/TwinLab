import { Component } from "react";

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("TwinLab Application Error Caught by Boundary:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        try {
            sessionStorage.removeItem("twinlab_workspace_draft");
        } catch (e) {}
        window.location.reload();
    };

    handleReturnHome = () => {
        try {
            sessionStorage.removeItem("twinlab_workspace_draft");
            localStorage.setItem("twinlab_active_view", "home");
        } catch (e) {}
        window.location.hash = "";
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    width: "100vw",
                    background: "#0a0f1d",
                    color: "#f8fafc",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    padding: "24px",
                    textAlign: "center"
                }}>
                    <div style={{
                        maxWidth: "520px",
                        background: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "18px",
                        padding: "36px 28px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
                    }}>
                        <div style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "14px",
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 18px",
                            fontSize: "26px",
                            color: "#ef4444"
                        }}>
                            ⚡
                        </div>
                        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
                            TwinLab Recovered from an Issue
                        </h2>
                        <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "16px" }}>
                            A component encountered a runtime issue.
                        </p>
                        {this.state.error && (
                            <div style={{
                                background: "rgba(0, 0, 0, 0.4)",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                                borderRadius: "8px",
                                padding: "12px",
                                margin: "0 0 20px",
                                textAlign: "left",
                                overflowX: "auto",
                                maxHeight: "160px"
                            }}>
                                <code style={{
                                    color: "#fca5a5",
                                    fontSize: "11px",
                                    fontFamily: "monospace",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word"
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </code>
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: "10px 18px",
                                    background: "#FF8A00",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    cursor: "pointer"
                                }}
                            >
                                Reload Workspace
                            </button>
                            <button
                                onClick={this.handleReturnHome}
                                style={{
                                    padding: "10px 18px",
                                    background: "rgba(255, 255, 255, 0.08)",
                                    color: "#cbd5e1",
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    cursor: "pointer"
                                }}
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
