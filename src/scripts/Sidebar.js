// Written by Gary Antier 2020
// Current version 0.2.0.1

const RecentLinksKey = "recentLinks";
const FavoriteLinksKey = "favoriteLinks";

class NavigationLink {
    constructor(text, path, groupId) {
        this.id = text.replace(/\s/g, '_')
                      .toLowerCase();
        this.text = text;
        this.path = path;
        this.groupId = groupId;
        this.favorite = false;
        this.active = false;
        this.lastAccess = null;
        this.node = null;
        this.iconNode = null;

        this.initNodes();
    }

    initNodes() {
        let link = syn.create("a")
                      .attr("href", this.path)
                      .addClass("navigation-link");
        let text = syn.create("span")
                      .text(this.text);
        let favIcon = syn.create("button")
                         .addClass("favorite-icon", "material-icons");

        link.append(text);
        link.append(favIcon);

        this.node = link;
        this.iconNode = favIcon;
    }

    addToRecents() {
        let strRecentLinks = window.localStorage.getItem(RecentLinksKey);
        let recentLinks = JSON.parse(strRecentLinks) ?? [];
        
        this.active = true;
        this.lastAccess = Date.now();
        
        // Note: Add new entry to end and if limit is reached (3), shift others up while topmost entry are removed.
        //       If already exist, replace.
        recentLinks = recentLinks.filter(l => l.id != this.id);
        if(recentLinks.length == 3) {
            recentLinks.shift();
        }
        recentLinks.push({
            id: this.id,
            text: this.text,
            path: this.path,
            lastAccess: this.lastAccess
        });

        strRecentLinks = JSON.stringify(recentLinks);
        window.localStorage.setItem(RecentLinksKey, strRecentLinks);
    }

    toggleFavoriteIcon() {
        let text = this.favorite ? "star" : "star_border";
        let title = this.favorite ? "Remove from Favorites" : "Add to Favorites";
        
        if(this.favorite) {
            this.iconNode.addClass("active");
        } else {
            this.iconNode.removeClass("active");
        }

        this.iconNode.attr("title", title)
                     .text(text);
    }

    draw() {
        this.toggleFavoriteIcon();
        if(this.active && this.groupId != "recents") {
            this.node.addClass("active");
        }
    }
}

class NavigationGroup {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.node = null;
        this.containerNode = null;

        this.initNodes();
    }

    initNodes() {
        let group = syn.create("div")
                       .addClass("navigation-group");
        let title = syn.create("span")
                       .addClass("navigation-group-title")
                       .text(this.title);
        let container = syn.create("div")
                           .addClass("navigation-links-container");
            
        group.append(title)
             .append(container);

        this.node = group;
        this.containerNode = container;
    }

    draw(links) {
        links.forEach(l => {
            l.draw();
            this.containerNode.append(l.node);
        });

        this.node.addClass("active");
        return this.node;
    }
}

class SidebarLayout {
    constructor() {
        this.navigation = syn.query("#sidebar_navigation");
        this.favLinksGroup = null;
        this.favoriteLinks = [];
        this.navigationGroups = [];
        this.navigationLinks = [];
        this.activeLink = null;

        this.initFavoritesNavGroup();
        this.initRecentsNavGroup();
    }

    initFavoritesNavGroup() {
        let favLinksGroup = new NavigationGroup("favorites", "Favorites");
        this.favLinksGroup = favLinksGroup;
        this.navigationGroups.push(favLinksGroup);

        let strFavLinks = window.localStorage.getItem(FavoriteLinksKey);
        let favoriteLinks = JSON.parse(strFavLinks) ?? [];

        favoriteLinks.sort();
        favoriteLinks.forEach(l => {
            this.favoriteLinks.push(l.id);
            this.addLink("Favorites", l.text, l.path);
        });
    }

    initRecentsNavGroup() {
        let strRecentLinks = window.localStorage.getItem(RecentLinksKey);
        let recentLinks = JSON.parse(strRecentLinks) ?? [];

        recentLinks.sort((l1, l2) => l2.lastAccess - l1.lastAccess);
        recentLinks.forEach(l => {
            this.addLink("Recents", l.text, l.path)
        });
    }

    addLink(group, text, path) {
        let groupId = group.replace(/\s/g, '_')
                           .toLowerCase();

        // Group...
        let groupExists = this.navigationGroups.some(g => g.id == groupId);
        if(groupExists == false) {
            let navGroup = new NavigationGroup(groupId, group);
            this.navigationGroups.push(navGroup);
        }
        
        // Links...
        let link = new NavigationLink(text, path, groupId);
        link.favorite = this.favoriteLinks.includes(link.id);

        let location = window.location;
        let currentURL = new URL(path, location);
        if(location.pathname == currentURL.pathname) {
            link.addToRecents();
        }
        
        this.navigationLinks.push(link);
        return link;
    }

    updateFavorites(link) {
        let favorite = !link.favorite;
        let group = this.favLinksGroup;
        let strFavLinks = window.localStorage.getItem(FavoriteLinksKey);
        let favoriteLinks = JSON.parse(strFavLinks) ?? [];
        let links = [];
        
        // State...
        // NOTE: By default, current link are removed.
        //       Only if it's marked favorite when pushed again.
        favoriteLinks = favoriteLinks.filter(l => l.id != link.id);
        if(favorite) {
            favoriteLinks.push({
                id: link.id,
                text: link.text,
                path: link.path,
                favorite: true
            });
        }

        strFavLinks = JSON.stringify(favoriteLinks);
        window.localStorage.setItem(FavoriteLinksKey, strFavLinks);

        // Clear...
        this.favoriteLinks = [];
        this.navigationLinks = this.navigationLinks.filter(l => l.groupId != "favorites");
        group.node.removeClass("active");
        group.containerNode.empty();

        // Redraw...
        favoriteLinks.sort();
        favoriteLinks.forEach(l => {
            this.favoriteLinks.push(l.id);
            let link = this.addLink("Favorites", l.text, l.path);
            
            link.iconNode.click(e => {
                e.preventDefault();
                this.updateFavorites(link);
            });
            
            links.push(link);
        });

        if(favoriteLinks.length > 0) {
            group.draw(links);
        }
        
        // Style...
        this.navigationLinks.forEach(l => {
            if(l.id == link.id) {
                l.favorite = favorite;
                l.toggleFavoriteIcon();
            }
        });
    }

    draw() {
        this.navigation.empty();
        this.navigationGroups.forEach(g => {
            let links = this.navigationLinks.filter(l => l.groupId == g.id);

            if(links.length > 0) {
                g.draw(links);
                
                // Favorite listeners...
                links.forEach(l => {
                    l.iconNode.click(e => {
                        e.preventDefault();
                        this.updateFavorites(l);
                    });
                });
            }

            this.navigation.append(g.node);
        });
    }
}

const globalSidebar = new SidebarLayout();