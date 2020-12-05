// Written by Gary Antier 2020
// Current version 0.1.0.0

const RecentLinksKey = "recentLinks";
const FavoriteLinksKey = "favoriteLinks";

class NavigationLink {
    constructor(text, path, groupId, root) {
        this.id = text.replace(/\s/g, '_')
                      .toLowerCase();
        this.text = text;
        this.path = path;
        this.groupId = groupId;
        this.root = root;
        this.favorite = false;
        this.active = false;
        this.lastAccess = null;
    }

    toggleFavorites(e) {
        e.preventDefault();
        let favorite = this.favorite;
        let icon = syn.wrap(e.target);
        let text = favorite ? "star_border" : "star"
        let strFavLinks = window.localStorage.getItem(FavoriteLinksKey);
        let favLinks = JSON.parse(strFavLinks) ?? [];

        icon.text(text);
        if(favorite) {
            favLinks = favLinks.filter(l => l.id != this.id);
            icon.removeClass("active");
        } else {
            let exists = favLinks.some(l => l.id == this.id);
            if(exists == false) {
                favLinks.push(this);
            }
            icon.addClass("active");
        }

        strFavLinks = JSON.stringify(favLinks);
        window.localStorage.setItem(FavoriteLinksKey, strFavLinks);

        this.favorite = !favorite;
        globalSidebar.drawFavoritesNavGroup();
    }

    draw() {
        let link = syn.create("a")
                      .attr("href", this.path)
                      .addClass("navigation-link");

        let text = syn.create("span")
                      .text(this.text);

        let favIconText = this.favorite ? "star" : "star_border";
        let favIconTitle = this.favorite ? "Remove from Favorites" : "Add to Favorites";
        let favIcon = syn.create("button")
                         .addClass("favorite-icon", "material-icons")
                         .attr("title", favIconTitle)
                         .text(favIconText);
                 
        if (this.favorite) {
            favIcon.addClass("active");
        }
        if(this.active) {
            link.addClass("active");
        }
        
        favIcon.click(e => this.toggleFavorites(e));

        link.append(text);
        link.append(favIcon);

        return link;
    }
}

class NavigationGroup {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.container = null;
    }

    draw(links) {
        let group;
        
        if(this.container == null) {
            group = syn.create("div")
                           .addClass("navigation-group");
            let title = syn.create("span")
                           .addClass("navigation-group-title")
                           .text(this.title);
            this.container = syn.create("div")
                                .addClass("navigation-links-container");
            
            group.append(title)
                .append(this.container);
        }
        
        this.container.empty();
        links.forEach(l => {
            let link = l.draw();
            this.container.append(link);
        });

        return group;
    }
}

class SidebarLayout {
    constructor() {
        let strFavLinks = window.localStorage.getItem(FavoriteLinksKey);

        this.navigation = syn.query("#sidebar_navigation");
        this.favoriteLinks = JSON.parse(strFavLinks) ?? [];
        this.favLinksGroup = new NavigationGroup("favorites", "Favorites");
        this.navigationGroups = [];
        this.navigationLinks = [];
        this.activeLink = null;
    }

    drawFavoritesNavGroup() {
        let strFavLinks = window.localStorage.getItem(FavoriteLinksKey);
        let favoriteLinks = JSON.parse(strFavLinks) ?? [];
        let links = [];
        
        // Sort...
        favoriteLinks.sort();

        // Initialize...
        favoriteLinks.forEach(l => {
            let link = new NavigationLink(l.text, l.path, "favorites");
            link.favorite = true;
            links.push(link);
        });

        // Draw...
        if(links.length > 0) {
            let group = this.favLinksGroup.draw(links);
            if(group != null) {
                this.navigation.append(group);
            }
        }
    }

    drawRecentsNavGroup() {
        let strRecentLinks = window.localStorage.getItem(RecentLinksKey);
        let recentLinks = JSON.parse(strRecentLinks) ?? [];
        let recents = new NavigationGroup("recents", "Recents");
        let links = [];

        // Update...
        // Note: Add new entry to end and if limit is reached (3), shift others up while topmost entry are removed.
        //       If already exist, replace.
        let match = recentLinks.filter(l => l.path == this.activeLink.path);
        if(match.length == 0) {
            if(recentLinks.length == 3) {
                recentLinks.shift();
            }
            recentLinks.push(this.activeLink);
        } else {
            let index = recentLinks.indexOf(match[0]);
            recentLinks[index] = this.activeLink;
        }

        strRecentLinks = JSON.stringify(recentLinks);
        window.localStorage.setItem(RecentLinksKey, strRecentLinks);
        
        // Sort...
        recentLinks.sort((l1, l2) => {
            let d1 = new Date(l1.lastAccess);
            let d2 = new Date(l2.lastAccess);

            return  d1 < d2 ? 1 : -1;
        });

        // Initialize...
        recentLinks.forEach(l => {
            let link = new NavigationLink(l.text, l.path, "recents");
            link.favorite = this.favoriteLinks.some(l2 => l2.id == link.id);
            links.push(link);
        });

        // Draw...
        if(links.length > 0) {
            let group = recents.draw(links);
            this.navigation.append(group);
        }
    }

    addLink(group, text, path) {
        let groupId = group.replace(/\s/g, '_')
                           .toLowerCase();

        // Links...
        let navLink = new NavigationLink(text, path, groupId);
        let activeURL = new URL(window.location);
        let currentURL = new URL(path, activeURL);
        let favorite = this.favoriteLinks.some(l => l.id == navLink.id);

        navLink.favorite = favorite;
        if(activeURL.pathname == currentURL.pathname) {
            navLink.active = true;
            navLink.lastAccess = Date.now();
            this.activeLink = navLink;
        }
        
        this.navigationLinks.push(navLink);

        // Group...
        let groupExists = this.navigationGroups.some(g => g.id == groupId);
        if(groupExists == false) {
            let navGroup = new NavigationGroup(groupId, group);
            this.navigationGroups.push(navGroup);
        }
    }

    draw() {
        this.navigation.empty();
        this.drawFavoritesNavGroup();
        this.drawRecentsNavGroup();
        this.navigationGroups.forEach(g => {
            let links = this.navigationLinks.filter(l => l.groupId == g.id);

            if(links.length > 0) {
                let group = g.draw(links);
                this.navigation.append(group);
            }
        });
    }
}

const globalSidebar = new SidebarLayout();