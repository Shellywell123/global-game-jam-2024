import { useApp, Stage } from "@pixi/react";
import { ReactElement } from "react";

function FullScreenStage(props: { children: ReactElement }) {
    const app = useApp();
    
    return <Stage width={app.screen.width} height={app.screen.height} options={{ backgroundColor: 0xeef1f5 }}>
        {props.children}
    </Stage>
}

export default FullScreenStage;