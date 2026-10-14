type Language = "Python" | "Java" | "C++" | "C" | "JavaScript" | "Go" | "Rust";

export const referenceSolutions: Record<string, Partial<Record<Language, string>>> = {
  "Two Sum": {
    Java: `import java.util.*;

class Solution {
  public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int need = target - nums[i];
      if (seen.containsKey(need)) return new int[] { seen.get(need), i };
      seen.put(nums[i], i);
    }
    return new int[] {};
  }
}`,
    Python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, value in enumerate(nums):
            need = target - value
            if need in seen:
                return [seen[need], i]
            seen[value] = i
        return []`,
  },
  "Valid Palindrome": {
    Java: `class Solution {
  public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
      while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
      while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
      if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) return false;
      left++; right--;
    }
    return true;
  }
}`,
    Python: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        left, right = 0, len(s) - 1
        while left < right:
            while left < right and not s[left].isalnum(): left += 1
            while left < right and not s[right].isalnum(): right -= 1
            if s[left].lower() != s[right].lower(): return False
            left, right = left + 1, right - 1
        return True`,
  },
  "Reverse String": {
    Java: `class Solution {
  public void reverseString(char[] s) {
    for (int left = 0, right = s.length - 1; left < right; left++, right--) {
      char temp = s[left]; s[left] = s[right]; s[right] = temp;
    }
  }
}`,
    Python: `class Solution:
    def reverseString(self, s: list[str]) -> None:
        left, right = 0, len(s) - 1
        while left < right:
            s[left], s[right] = s[right], s[left]
            left, right = left + 1, right - 1`,
  },
  "Contains Duplicate": {
    Java: `import java.util.*;

class Solution {
  public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int value : nums) if (!seen.add(value)) return true;
    return false;
  }
}`,
    Python: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        return len(nums) != len(set(nums))`,
  },
  "Best Time to Buy and Sell Stock": {
    Java: `class Solution {
  public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, best = 0;
    for (int price : prices) {
      minPrice = Math.min(minPrice, price);
      best = Math.max(best, price - minPrice);
    }
    return best;
  }
}`,
    Python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        low, best = float("inf"), 0
        for price in prices:
            low = min(low, price)
            best = max(best, price - low)
        return best`,
  },
  "Binary Search": {
    Java: `class Solution {
  public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
      int mid = left + (right - left) / 2;
      if (nums[mid] == target) return mid;
      if (nums[mid] < target) left = mid + 1; else right = mid - 1;
    }
    return -1;
  }
}`,
    Python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = left + (right - left) // 2
            if nums[mid] == target: return mid
            if nums[mid] < target: left = mid + 1
            else: right = mid - 1
        return -1`,
  },
  "Valid Parentheses": {
    Java: `import java.util.*;

class Solution {
  public boolean isValid(String s) {
    Map<Character, Character> close = Map.of(')', '(', ']', '[', '}', '{');
    Deque<Character> stack = new ArrayDeque<>();
    for (char ch : s.toCharArray()) {
      if (close.containsKey(ch)) {
        if (stack.isEmpty() || stack.pop() != close.get(ch)) return false;
      } else stack.push(ch);
    }
    return stack.isEmpty();
  }
}`,
    Python: `class Solution:
    def isValid(self, s: str) -> bool:
        pairs, stack = {")": "(", "]": "[", "}": "{"}, []
        for ch in s:
            if ch in pairs:
                if not stack or stack.pop() != pairs[ch]: return False
            else: stack.append(ch)
        return not stack`,
  },
  "Merge Two Sorted Arrays": {
    Java: `import java.util.*;

class Solution {
  public int[] merge(int[] nums1, int[] nums2) {
    int[] out = new int[nums1.length + nums2.length];
    int i = 0, j = 0, k = 0;
    while (i < nums1.length && j < nums2.length) out[k++] = nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++];
    while (i < nums1.length) out[k++] = nums1[i++];
    while (j < nums2.length) out[k++] = nums2[j++];
    return out;
  }
}`,
    Python: `class Solution:
    def merge(self, nums1: list[int], nums2: list[int]) -> list[int]:
        out, i, j = [], 0, 0
        while i < len(nums1) and j < len(nums2):
            if nums1[i] <= nums2[j]: out.append(nums1[i]); i += 1
            else: out.append(nums2[j]); j += 1
        return out + nums1[i:] + nums2[j:]`,
  },
  "Maximum Subarray": {
    Java: `class Solution {
  public int maxSubArray(int[] nums) {
    int current = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
      current = Math.max(nums[i], current + nums[i]);
      best = Math.max(best, current);
    }
    return best;
  }
}`,
    Python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        current = best = nums[0]
        for value in nums[1:]:
            current = max(value, current + value)
            best = max(best, current)
        return best`,
  },
  "Longest Substring Without Repeating Characters": {
    Java: `import java.util.*;

class Solution {
  public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
      char ch = s.charAt(right);
      if (last.containsKey(ch)) left = Math.max(left, last.get(ch) + 1);
      last.put(ch, right);
      best = Math.max(best, right - left + 1);
    }
    return best;
  }
}`,
    Python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last, left, best = {}, 0, 0
        for right, ch in enumerate(s):
            if ch in last: left = max(left, last[ch] + 1)
            last[ch] = right
            best = max(best, right - left + 1)
        return best`,
  },
};
