function addClass(target, ...tokens) {
    tokens.forEach(token => {
        target.classList.add(token);
    });
}

function removeClass(target, token) {
    target.classList.remove(token);
}

function hasClass(target, token) {
    return target.classList.contains(token);
}

function enable(input, enable) {
    if (enable || enable === undefined) {
        input.removeAttribute("disabled");
    } else {
        input.setAttribute("disabled", "");
    }
}

function disable(input) {
    enable(input, false);
}

function attr(target, name, value) {
    if (value) {
        target.setAttribute(name, value);
        return target;
    } else {
        return target.getAttribute(name);
    }
}

function name(input, name) {
    return attr(input, "name", name);
}

function data(target, name, value) {
    return attr(target, `data-${name}`, value);
}

function element(element) {
    return document.createElement(element);
}

function html(target, html) {
    if (html) {
        target.innerHTML = html;
        return target;
    } else {
        return target.innerHTML;
    }
}

function append(parent, child) {
    parent.appendChild(child);
}

function empty(target) {
    target.innerHTML = "";
    target.innerText = "";
}

function value(input, value) {
    if (value !== undefined) {
        input.value = value;
        return input;
    } else {
        value = input.value;
        if (data(input, "type") === "number" || attr(input, "type") === "number") {
            return value !== "" ? value : "0";
        } else {
            return value;
        }
    }
}

function intValue(input) {
    return parseInt(value(input));
}

function floatValue(input) {
    return parseFloat(value(input));
}

function option(select, val, text) {
    let opt = element("option");

    value(opt, val);
    html(opt, text);
    append(select, opt);

    return opt;
}

// TODO: Remove existing dependencies to the non-OOP version.

// Written by Gary Antier 2020
// This script provides utility for simplifying common JavaScript syntaxes.
// This works similar to jQuery although not as powerful.
// Adapted/consolidated from Syntax.js (RAFO - non OOP) and framework.js (RAFO - OOP, multi purpose script).
// Current version 0.4.0.5

class Syntax {
    constructor(self) {
        this.self = self;
        this.nodes = [this];
    }

    // HTML...
    static query(selector, parent) {
        let node;
        let isString = typeof selector === "string";

        node = isString ? parent.querySelectorAll(selector) : selector;

        return syn.wrap(node);
    }

    static wrap(nodes) {
        let syntax;

        if (nodes instanceof NodeList) {
            let length = nodes.length;
            if (length === 0)
                return null;

            syntax = new Syntax(nodes[0]);
            for (let idx = 1; idx < length; idx++) {
                let node = new Syntax(nodes[idx]);
                syntax.nodes.push(node);
            }
        } else {
            syntax = new Syntax(nodes);
        }

        return syntax;
    }

    static create(element) {
        // TODO: Improve, implement document based creation.
        var node = document.createElement(element);

        return syn.wrap(node);
    }

    query(selector) {
        return syn.query(selector, this.self);
    }

    html(content) {
        if (content !== undefined) {
            this.self.innerHTML = content;
            return this;
        } else {
            return this.self.innerHTML;
        }
    }

    text(content) {
        if (content !== undefined) {
            this.self.innerText = content;
            return this;
        } else {
            return this.self.innerText;
        }
    }

    empty() {
        this.html(null);
        this.text(null);

        return this;
    }

    get parentNode() {
        return this.self.parentNode;
    }

    get parent() {
        return syn.wrap(this.parentNode);
    }

    append(childSyntax, returnChild) {
        this.self.appendChild(childSyntax.self);

        return returnChild ? childSyntax : this;
    }

    insert(siblingSyntax, sisterSyntax) {
        this.parentNode.insertBefore(siblingSyntax.self, sisterSyntax);
    }

    insertBefore(siblingSyntax, returnSibling) {
        this.insert(siblingSyntax, this.self);

        return returnSibling ? siblingSyntax : this;
    }

    insertAfter(siblingSyntax, returnSibling) {
        this.insert(siblingSyntax, this.self.nextSibling);

        return returnSibling ? siblingSyntax : this;
    }

    static remove(syntax) {
        syntax.parentNode.removeChild(syntax.self);
        syntax = undefined;
    }

    // Attributes...
    attr(name, value) {
        if (value !== undefined) {
            this.self.setAttribute(name, value);

            return this;
        } else {
            return this.self.getAttribute(name);
        }
    }

    removeAttr(name) {
        this.self.removeAttribute(name);

        return this;
    }

    data(name, value) {
        return this.attr(`data-${name}`, value);
    }

    get nodeName() {
        return this.self.nodeName;
    }

    get bounds() {
        return this.self.getBoundingClientRect();
    }

    get boundsHeight() {
        return this.bounds.height;
    }

    get boundsWidth() {
        return this.bounds.width;
    }

    get boundsTop() {
        return this.bounds.top;
    }

    get boundsRight() {
        return this.bounds.right;
    }

    get boundsBottom() {
        return this.bounds.bottom;
    }

    get boundsLeft() {
        return this.bounds.left;
    }

    // Class...
    get class() {
        return this.self.classList;
    }

    hasClass(token) {
        return this.class.contains(token);
    }

    addClass(...tokens) {
        tokens.forEach(_class => {
            this.class.add(_class);
        });

        return this;
    }

    removeClass(token) {
        this.class.remove(token);

        return this;
    }

    // Input...
    type(token) {
        return this.attr("type", token);
    }

    name(name) {
        return this.attr("name", name);
    }

    enable(enable) {
        if (enable ?? true) {
            this.removeAttr("disabled");
        } else {
            this.attr("disabled", "");
        }

        return this;
    }

    disable() {
        this.enable(false);

        return this;
    }

    get value() {
        return this.self.value;
    }

    set value(value) {
        this.self.value = value;
    }

    val(value) {
        if (value !== undefined) {
            this.value = value;

            return this;
        } else {
            value = this.value;

            if (this.attr("type") === "number" && value == "")
                value = "0";

            return value;
        }
    }

    addOption(value, text) {
        let option = syn.create("option");
        option.val(value).text(text);
        this.append(option);

        return this;
    }

    get checked() {
        return this.self.checked;
    }

    get files() {
        return this.self.files;
    }

    // Events...
    on(event, callback) {
        this.self.addEventListener(event, callback);
    }

    static ready(callback) {
        document.addEventListener("DOMContentLoaded", callback.bind(document));
    }

    click(callback) {
        this.on("click", callback);
    }

    input(callback) {
        this.on("input", callback);
    }

    change(callback) {
        this.on("change", callback);
    }

    // Tables...
    addRow() {
        let row = syn.create("tr");
        this.append(row);

        return row;
    }

    addColumn(html) {
        let col = syn.create("td");
        this.append(col);

        if (html !== undefined)
            col.append(html);

        return col;
    }
}

this.syn = {
    document: Syntax.wrap(document),
    body: Syntax.wrap(document.body),
    ready: callback => Syntax.ready(callback),
    query: (selector, parent = document) => Syntax.query(selector, parent),
    wrap: (node, parent = document) => Syntax.wrap(node, parent),
    create: element => Syntax.create(element),
    remove: syntax => Syntax.remove(syntax)
};