function addCopyButtons(clipboard) {
    document.querySelectorAll('.copy-code').forEach(function (copyCode) {
        var codeBlock = copyCode.nextElementSibling.firstChild.firstChild;
        var button = buildButton(codeBlock.innerHTML, false);
        codeBlock.parentNode.insertBefore(button, codeBlock);
    });

    document.querySelectorAll('.copy-first-line').forEach(function (copyFirstLine) {
        var codeBlock = copyFirstLine.nextElementSibling.firstChild.firstChild;
        var button = buildButton(codeBlock.innerHTML, true);
        codeBlock.parentNode.insertBefore(button, codeBlock);
    });

    function buildButton(html, firstLine) {
        var button = document.createElement('button');
        button.className = 'copy-code-button';
        button.type = 'button';
        button.innerText = 'Copy';

        button.addEventListener('click', function () {
            var div = document.createElement("div");
            div.innerHTML += html.replaceAll('class="hl">\n', 'class="hl">');
            var copyText = "";

            let lines = div.innerText.split("\n");
            for(var idx in lines) {
                let line = lines[idx];

                if (line.indexOf('$ ') == 0 || line.indexOf('D ') == 0) {
                    copyText += line.substring(2);
                } else if (line.indexOf('>> ') == 0) {
                    copyText += line.substring(3);                    
                } else {
                    console.log(0);
                    copyText += line;
                }

                if (idx < lines.length -1) {
                    copyText += "\n"
                }

                if (firstLine) {
                    break;
                }
            }

            clipboard.writeText(copyText).then(function () {
                button.blur();
                button.innerText = 'Copied!';
                setTimeout(function () {
                    button.innerText = 'Copy';
                }, 2000);
            }, function (error) {
                button.innerText = 'Error';
            });
        });

        return button;
    }
}

if (navigator && navigator.clipboard) {
    addCopyButtons(navigator.clipboard);
}