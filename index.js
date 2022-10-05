import '@logseq/libs';
import { splitBlock } from "./splitBlock";

async function getCurrentBlockAndId() {
    const block = await logseq.Editor.getCurrentBlock()
    const blockId = block?.uuid
    return { block, blockId }
}

async function showMsg(str) {
    logseq.App.showMsg(str)
    // typeBlock();
    // const contentsPage = await logseq.Editor.getPage('contents');
    // logseq.Editor.openInRightSidebar(contentsPage.uuid);
    // const block = await logseq.Editor.appendBlockInPage(contentsPage.name, "");
    // console.log(block);
    // await logseq.Editor.editBlock(block?.uuid);
}

function addShortcut(id, label, key, callback, param) {
    logseq.App.registerCommandPalette({
        key: id,
        label,
        keybinding: {
            mode: 'global',
            binding: key
        }
    }, async () => {
        await callback(param)
    })
}
function journalDate() {
    const date = new Date()

    let day = date.getDate()
    const numString = ['', 'st', 'nd', 'rd']
    day += day < 4 ? numString[day] : ''

    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.toLocaleString('en-US', { year: 'numeric' })
    const dateString = month + ' ' + day + ', ' + year;
    return dateString.toLowerCase();
}

// start typing on current page : https://github.com/sawhney17/logseq-go-now/blob/main/index.js
async function typeBlock() {
    let currentPage = await logseq.Editor.getCurrentPage();
    if (currentPage == null) {
        currentPage = await logseq.Editor.getPage(journalDate())
    }

    const allBlocks = await logseq.Editor.getPageBlocksTree(currentPage?.name)
    const lastBlock = allBlocks[allBlocks.length - 1]

    console.log(lastBlock);

    if (lastBlock?.uuid) {
        let newBlockId = lastBlock?.uuid

        if (lastBlock?.content != '') {
            const newBlock = await logseq.Editor.insertBlock(newBlockId, '', {
                before: false,
                sibling: true,
            });
            newBlockId = newBlock?.uuid;
        }

        logseq.Editor.scrollToBlockInPage(currentPage.name, newBlockId);
        setTimeout(async () => {
            await logseq.Editor.editBlock(newBlockId);
        }, 1000);
    }
}

async function createNextBlock(isSibling = true) {
    const { block, blockId } = await getCurrentBlockAndId();

    const isEditing = await logseq.Editor.checkEditing();
    if (isEditing == false) {
        await typeBlock()
    }

    if (blockId) {

        if (!isSibling) {
            if (block.children?.length) {
                try {
                    logseq.Editor.setBlockCollapsed(blockId, { flag: false })
                } catch (error) {
                    console.log(error);
                }
            }
        }

        const newBlock = await logseq.Editor.insertBlock(blockId, '', {
            before: false,
            sibling: isSibling,
        });

        if (newBlock?.uuid) {
            await logseq.Editor.editBlock(newBlock.uuid);
        }
    }
}

async function toggleCurrentBlock() {
    const { block, blockId } = await getCurrentBlockAndId()

    if (blockId) {
        if (block.children?.length > 0) {
            try {
                await logseq.Editor.setBlockCollapsed(blockId, { flag: "toggle" })
            } catch (error) {
                console.log(error);
            }
        }
    }
}

async function trimBlockContent(block) {
    const newContent = block?.content.replace(/\s+/g, ' ')
    await logseq.Editor.updateBlock(block?.uuid, newContent)
}

async function applyOnBlocks(applyOnSingleBlock) {
    const selected = await logseq.Editor.getSelectedBlocks();
    if (selected && selected.length > 1) {
        for (let block of selected) {
            applyOnSingleBlock(block)
        }
    } else {
        const block = await logseq.Editor.getCurrentBlock();
        if (block?.uuid) {
            applyOnSingleBlock(block)
        }
    }
}

async function split(block) {
    const blockId = block?.uuid;
    const newBlocks = splitBlock(block.content).map((b) => {
        return {
            ...b,
            children: b.children.length ? b.children : undefined,
        };
    });
    if (newBlocks.length === 0) {
        return;
    }
    await logseq.Editor.insertBatchBlock(blockId, newBlocks, {
        sibling: true,
    });
    await logseq.Editor.removeBlock(blockId);
}

async function addTimestamp() {
    // replace timestamp regex : \*\*(\d*\:\d*\s\w*)\*\*\s\-\s 
    const { block, blockId } = await getCurrentBlockAndId();
    const time = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timestamp = '**' + time + '** - ';
    await logseq.Editor.updateBlock(blockId, timestamp + block?.content);
}

async function toggleCodeBlock() {
    const { block, blockId } = await getCurrentBlockAndId();
    let content = block?.content;
    const codeblock = '```';
    if (content.startsWith(codeblock)) {
        content = content.replace(codeblock, '').replace(codeblock, '').trim()
    } else {
        content = codeblock + '\n' + content + '\n' + codeblock
    }
    await logseq.Editor.updateBlock(blockId, content);
}

// const settings = [{
//     key: 'keyboardShortcut',
//     title: "Keyboard shortcut",
//     description: 'Keyboard shortcut to trigger going home',
//     type: 'string',
//     default: 'mod+g',
// }]

async function main() {
    console.log('⌨ shortcut plugin loaded');

    // logseq.useSettingsSchema(settings);

    const shortcuts = [
        {
            id: 'say-hi',
            label: 'Saying hi',
            key: 'alt+h',
            callback: showMsg,
            param: 'Say, Hi to shortcuts ⌨'
        },
        {
            id: `new-next-sibling-block`,
            label: `Create new sibling block`,
            key: 'alt+enter',
            callback: createNextBlock,
            param: true
        },
        {
            id: `new-next-child-block`,
            label: `Create new child block`,
            key: 'shift+mod+enter',
            callback: createNextBlock,
            param: false
        },
        {
            id: 'toggle-current-block',
            label: 'Toggle current block (expand or collapse)',
            key: 'alt+q',
            callback: toggleCurrentBlock,
            param: undefined
        },
        {
            id: 'toggle-all-blocks',
            label: 'Toggle all blocks (expand or collapse)',
            key: 'alt+f',
            callback: logseq.App.invokeExternalCommand,
            param: 'logseq.editor/toggle-open-blocks'
        },
        {
            id: 'open-plugins',
            label: 'Open plugins page',
            key: 'alt+a',
            callback: logseq.App.invokeExternalCommand,
            param: 'logseq.ui/goto-plugins'
        },
        {
            id: 'open-settings',
            label: 'Open settings page',
            key: 'alt+.',
            callback: logseq.App.invokeExternalCommand,
            param: 'logseq.ui/toggle-settings'
        },
        {
            id: 'open-left-sidebar',
            label: 'Open left sidebar',
            key: 'alt+z',
            callback: logseq.App.invokeExternalCommand,
            param: 'logseq.ui/toggle-left-sidebar'
        },
        {
            id: 'open-right-sidebar',
            label: 'Open right sidebar',
            key: 'alt+x',
            callback: logseq.App.invokeExternalCommand,
            param: 'logseq.ui/toggle-right-sidebar'
        },
        {
            id: 'trim-blocks',
            label: 'Trim or Kut wide spaces and newlines',
            key: 'alt+k',
            callback: applyOnBlocks,
            param: trimBlockContent
        },
        {
            id: 'split-blocks',
            label: 'Split blocks',
            key: 'alt+s',
            callback: applyOnBlocks,
            param: split
        },
        {
            id: 'add-time-stamp',
            label: 'Insert timestamp',
            key: 'alt+t',
            callback: addTimestamp,
            param: undefined
        },
        {
            id: 'toggle-code-block',
            label: 'Toggle codeblock',
            key: 'alt+c',
            callback: toggleCodeBlock,
            param: undefined
        },
    ]

    shortcuts.forEach(
        e => addShortcut(e.id, e.label, e.key, e.callback, e.param)
    )
}

logseq.ready(main).catch(console.error)
