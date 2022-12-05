import { Options, App } from "@4site/engrid-common"; // Uses ENGrid via NPM
// import { Options, App } from "../../engrid-scripts/packages/common"; // Uses ENGrid via Visual Studio Workspace
import "./sass/main.scss";
import { customScript } from "./scripts/main";
import { FormSwitch } from "./scripts/form-switch/form-switch";
import { XVerify } from "./scripts/xverify/xverify";

const options: Options = {

};
new App(options);

//(<any>window).FormSwitch = FormSwitch;
