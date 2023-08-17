import '@logseq/libs';

// import { logseq as PL } from "./package.json";
// const pluginId = PL.id;

const getUrlMD = async (title: string, link: string) => {
  return `[${title}](${link})`;
};

const getLinkMDTitle = async (url: string) => {
  try {
    return getUrlMD(url, url);
  } catch (error) {
    return url;
  }
};

export function pasteLink() {
  //   console.info(`#${pluginId}: MAIN`);
  var selectedText = '';
  //   logseq.Editor.onInputSelectionEnd(e => {
  //       selectedText = e.text;
  //       console.log(e)
  //   });

  const mainContentContainer = parent.document.getElementById(
    'main-content-container'
  );
  //   console.log(mainContentContainer);

  const handlePaste = async (event: ClipboardEvent) => {
    if (event.clipboardData && event?.clipboardData?.files?.length > 0) {
      return;
    }

    if (event.clipboardData) {
      const text = event.clipboardData.getData('text/plain');
      if (text !== '') {
        event.preventDefault();
        //   event.stopPropagation();
        console.log('Paste : ', text);
        console.log('Select : ', selectedText);

        // const convert = await getLinkMDTitle(text);
        // console.log("转换后格式", convert);
        // await logseq.Editor.insertAtEditingCursor(convert);
        return;
      }
    }
  };

  mainContentContainer &&
    mainContentContainer.addEventListener('paste', handlePaste);
}
