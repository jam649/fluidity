import styled from "@emotion/styled"

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2e2e2e;
  color: #e6e6e6;
  font-family: monospace;
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  z-index: 9999;
`

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 2px solid rgba(230, 230, 230, 0.2);
  border-top-color: #ffb4e6;
  border-radius: 50%;
  margin-right: 14px;
  animation: spin 0.9s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

export const LoadingOverlay = () => (
  <Overlay>
    <Spinner />
    SYNCING
  </Overlay>
)
