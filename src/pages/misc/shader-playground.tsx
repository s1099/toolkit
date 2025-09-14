import {
  Files,
  FolderItem,
  FolderPanel,
  FolderTrigger,
  SubFiles,
  FileItem,
} from "@/components/animate-ui/components/base/files";
import { Shader } from "react-shaders";


export function ShaderPlayground() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Shader Playground</h1>
      <div className="relative max-w-[500px] max-h-[350px] size-full rounded-2xl border bg-background overflow-auto">
        <Files className="w-full" defaultOpen={[""]}>
          <FolderItem value="textures">
            <FolderTrigger>textures</FolderTrigger>

            <FolderPanel>
              <SubFiles>
                <FileItem>texture.png</FileItem>
                <FileItem>texture.jpeg</FileItem>
                <FileItem>texture.jpg</FileItem>
              </SubFiles>
            </FolderPanel>
          </FolderItem>
          <FileItem>shader.frag</FileItem>
        </Files>
      </div>
      <div className="mt-6">
        <div className="w-[500px] h-[350px] rounded-xl border overflow-hidden">
        <Shader
            fs={`
#define G vec3(iResolution.xy,iTime)
void mainImage(out vec4 l,vec2 o){l-=l;
  for(float b=-1.;b<1.;b+=21e-3){
    vec2 e=cos(b*64.+G.z+vec2(0,11))*sqrt(1.-b*b);
    l+=(cos(b+vec4(9,2,3,2))+1.)*(1.-e.y)/
    dot(e=(o+o-G.xy)/G.y+vec2(e.x,b)/(e.y+2.),e)/3e3;}}

            `}
            vs=""
          />  
        </div>
      </div>
    </div>
  );
}
