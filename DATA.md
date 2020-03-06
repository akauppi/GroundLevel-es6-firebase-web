# Data

With Cloud Firestore, design of data schemas is steered by these considerations:

To go in-document:

- **Billing:** access is charged per document. Avoid sub-collections unless they are really required.

To go sub-collection:

- **Access:** you cannot restrict reading of individual fields &mdash; documents are either fully available or not at all. You can restrict write access to individual fields.
- **Security rules:** you cannot use in-document arrays as part of security rule logic ("allow if `uid` is found within the `authors`"). You can express this with sub-collections.
- **Document size:** Documents must fit 1MB - 89 bytes. If you think they might grow larger, split something to sub-collections.

>Do you know more guidance for steering database schema design in Firestore? Please share the info at [Gitter](https://gitter.im/akauppi/GroundLevel-firebase-web) or as a PR. 📝🙂

## Schemas

Schemas for the data stored in Firestore.

Collections are marked with `C <id-type>`.

### Projects

```
/projects:C <project-id: automatic>
   /title: string
   /created: time-stamp
   /removed: [time-stamp] 	// keep data resurrectable from the database console for a while; who removed is in the logs

   /users:C <uid>
      /role: "author"|"collaborator"
      [/lastOpened: time-stamp]	// written when starting to track a project's symbols
      [/pendingInvite: time-stamp]	// if the person has been invited, but hasn't visited

   /symbols: [{
      id: <symbol-id>		// made e.g. from 'uid' and a time, by client
      shape: "star"      // potentially more shapes
      size: int
      fillColor: <color-string>
      x: <number>        // center
      y: <number>
   }, ...]
      
   /claims:C <symbol-id>    // edited or dragged by a certain user
      /by: uid
      /since: time-stamp
```

Spreading things into subcollections is mainly decided by security rules. If one needs to use a collection entry in the rules, such entries need to be in a sub-collection (not a map within a document).


#### Users sub-collection

The `users` collection is used for access control (`.role`), but also for sharing human-consumable information about the users, among each other (`.name`, `.photoURL`).

Keeping users' `name` and `photoURL` within the projects collection provides more privacy than having them as a root-level collection (at the price of duplicating for each project one works with). 

When project specific, only the people working together can see each others' names and picture. As a root level collection, either access rights management would become complex or impossible (security role "is user X in the same collection with `request.auth.uid`, in any of the projects"?), or names and photos could be seen with anyone signed in to the app.

Note: The `.name` and `.photoURL` fields are optional, since they can be set only by the user themselves. Between an invite and signing in, those fields are empty. 

>Note: The `.name` and `.photoURL` could be handled by a backend function, having access to all the users and being able to handle access rules of any complexity. This may be the better way, and would lead to the fields being dropped from this schema, replaced by a service.

#### Symbols sub-collection

Symbols are not tied to the person originally drawing them. Anyone may change any.

New symbols should be added with a higher `layer` than previous ones. This is not enforced across users - there is a possibility two symbols would end up on the same layer (from different users, creating them at the same time). Not a problem[^1].

[^1]: maybe we should store the creating user's id as a secondary sorting key to keep sorting deterministic, though.


#### Access roles

The authors are able to (and collaborators are not):

- change the title of a project
- invite new people to the project (as collaborators or authors)
- close the project

If the project is closed, its `removed` field is set to the closing date. Such project can be resurrected manually, from the Firestore console, or completely removed once a certain grace period has passed by.

>Note: If you only have application-wide admin roles, using "custom user claims" (data carried within the authentication token) may be the better approach. See [here](https://medium.com/@gaute.meek/firestore-and-security-1d77812715c1) (blog, Nov 2018)

<!-- REMOVE
## Access rules

### Projects collection

This is visible for anyone signed in, and listed in `.collaborators`. <sup>★</sup>

|field|access|
|---|---|
|`title`|write: if author|
|`created`|create: if original creation; write: none|
|`authors`|write: if author|
|`collaborators`|write: if author|
|`lastUsed.<my-uid>`|write: if the current user's field|

>tbd. Let's see if `.lastUsed` can be a an object, or whether it deserves to be a collection of its own.

*★ In Firestore, we cannot do access rules based on multiple fields. We cannot state "anyone in `.authors` or `.collaborators`, but including all people in authors also as collaborators solves this.*
-->

### Use cases

With this data schema, we should be able to:

- list project id's where a user is author, collaborator or either
- get the title and other meta data of a project
- draw the symbols in the project
- observe new symbols being created, re-colored or resized (by others)


*Note: Firebase notifications could be used to inform users if they've been invited to projects etc. - we shouldn't need extra information for that.*


Note: We don't store history. Eventually, we could.

- i.e. snapshots when people especially save; ability to revert back to earlier snapshots (this does get complex, unless we can merge between snapshots and present diffs...)


<!-- tbd.
## Settings

User-specific settings are to be stored in this collection.

```
/settings:C <uid>
```

tbd.

- colors assigned to other users (same color would identify them in all projects)

-->