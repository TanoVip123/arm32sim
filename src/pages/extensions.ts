// extensions.ts
import "prism-code-editor/search.css";
import "prism-code-editor/invisibles.css";
import "prism-code-editor/languages/html";
import "prism-code-editor/languages/clike";
import "prism-code-editor/languages/css";

import { type PrismEditor } from "prism-code-editor";
import {
  searchWidget,
  highlightSelectionMatches,
  showInvisibles,
} from "prism-code-editor/search";
import { defaultCommands, editHistory } from "prism-code-editor/commands";
import { cursorPosition } from "prism-code-editor/cursor";
import { highlightBracketPairs } from "prism-code-editor/highlight-brackets";

export const addExtensions = (editor: PrismEditor) => {
  editor.addExtensions(
    highlightSelectionMatches(),
    showInvisibles(),
    searchWidget(),
    defaultCommands(),
    editHistory(),
    highlightBracketPairs(),
    cursorPosition(),
  );
};
