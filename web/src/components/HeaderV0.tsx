import { Toggle } from "@radix-ui/react-toggle";
import { FolderSyncIcon } from "../../public/icon/FolderSyncIcon";
import { GithubIcon } from "../../public/icon/GithubIcon";
import { RepeatIcon } from "../../public/icon/RepeatIcon";
import { Button } from "./ui/button";

const HeaderV0 = () => {
    return (
        <header className=" py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">

                <Button variant="ghost">
                    <GithubIcon className="w-5 h-5 mr-2" />
                    Login with GitHub
                </Button>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost">
                    <FolderSyncIcon className="w-5 h-5 mr-2" />
                    Sync Now
                </Button>
                <Toggle aria-label="Automatic Sync">
                    <RepeatIcon className="w-5 h-5" />
                </Toggle>
            </div>
        </header>
    );
}

export default HeaderV0;