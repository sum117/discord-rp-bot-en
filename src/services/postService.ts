import db from "../database";
import { Character } from "../models/Character";
import { Post, type PostType } from "../models/Post";
import { posts, postsToCharacters } from "../schema";

export default class PostService {
  public static async createPost(postData: PostType) {
    return await db.transaction(async (transaction) => {
      const [post] = await transaction
        .insert(posts)
        .values(postData)
        .returning();
      if (!post) {
        transaction.rollback();
        return;
      }

      for (const character of postData.characters) {
        await transaction
          .insert(postsToCharacters)
          .values({ characterId: character.id, postId: post.messageId });
      }

      return new Post({ ...post, characters: postData.characters });
    });
  }
  public static async getPostByMessageId(messageId: string) {
    const data = await db.query.postsToCharacters.findMany({
      where: (postsToCharacters, { eq }) =>
        eq(postsToCharacters.postId, messageId),
      with: { character: true, post: true },
    });

    if (!data.length) {
      console.log(`Post with ID ${messageId} not found.`);
      return null;
    }

    return new Post({
      ...data[0]!.post,
      characters: data.map(
        (postToCharacter) => new Character(postToCharacter.character)
      ),
    });
  }
}
